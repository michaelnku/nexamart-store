import OpenAI from "openai";
import {
  ModerationDecision,
  ModerationSeverity,
  ModeratorIdentityType,
  ModerationTargetType,
  ReviewStatus,
  SenderType,
  UserRole,
  type PrismaClient,
} from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { createAuditLog } from "@/lib/audit/service";
import { applyModerationEnforcement } from "@/lib/moderation/enforcement";

type MessageModerationTarget = {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderType: SenderType;
  content: string;
  createdAt: Date;
  conversation: {
    id: string;
    type: string;
    subject: string | null;
    storeId: string | null;
    productId: string | null;
  };
};

type MessageModerationSignal = {
  code: string;
  matches: string[];
  severity: ModerationSeverity;
  decision: ModerationDecision;
  strikeWeight: number;
  reviewRequired: boolean;
  reason: string;
};

type MessageModerationOutcome = {
  policyCode: string;
  severity: ModerationSeverity;
  decision: ModerationDecision;
  strikeWeight: number;
  reviewRequired: boolean;
  confidence: number;
  reason: string;
  matchedSignals: string[];
  source: "RULES" | "AI";
};

const moderationClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const CONTACT_PLATFORM_PATTERNS = [
  /whats\s*app/i,
  /\btelegram\b/i,
  /\binstagram\b/i,
  /\bfacebook\b/i,
  /\bwechat\b/i,
  /\bsnapchat\b/i,
  /\bx\s*\(?twitter\)?\b/i,
  /\btiktok\b/i,
];

const CONTACT_ACTION_PATTERNS = [
  /\bcall me\b/i,
  /\btext me\b/i,
  /\breach me\b/i,
  /\bcontact me\b/i,
  /\bdm me\b/i,
  /\bmessage me on\b/i,
  /\bchat me on\b/i,
  /\badd me on\b/i,
];

const PAYMENT_DIVERSION_PATTERNS = [
  /\bpay (?:me|outside|offline|direct(?:ly)?)\b/i,
  /\btransfer (?:the )?(?:money|payment|funds)\b/i,
  /\bbank transfer\b/i,
  /\bsend (?:the )?(?:money|payment|funds)\b/i,
  /\bpay via\b/i,
  /\bdeposit (?:the )?(?:money|funds)\b/i,
  /\boutside (?:the )?app\b/i,
  /\boff[- ]platform payment\b/i,
];

const PAYMENT_PROVIDER_PATTERNS = [
  /\bopay\b/i,
  /\bpalmpay\b/i,
  /\bcashapp\b/i,
  /\bzelle\b/i,
  /\bvenmo\b/i,
  /\bpaypal\b/i,
  /\bbitcoin\b/i,
  /\bcrypto\b/i,
];

const SCAM_PATTERNS = [
  /\btrust me\b/i,
  /\bno escrow\b/i,
  /\brefund you later\b/i,
  /\bonly today deposit\b/i,
  /\bsend deposit now\b/i,
  /\bpayment proof later\b/i,
  /\bkindly pay\b/i,
  /\bguaranteed return\b/i,
];

const ABUSIVE_PATTERNS = [
  /\bidiot\b/i,
  /\bstupid\b/i,
  /\bfool\b/i,
  /\bmoron\b/i,
  /\bthief\b/i,
  /\bscammer\b/i,
  /\bmad\b/i,
  /\buseless\b/i,
  /\bshut up\b/i,
  /\bdamn you\b/i,
];

const THREAT_PATTERNS = [
  /\bkill you\b/i,
  /\bhurt you\b/i,
  /\bbeat you\b/i,
  /\bdeal with you\b/i,
  /\bfind you\b/i,
  /\btrack you\b/i,
  /\bdestroy you\b/i,
  /\bcurse you\b/i,
];

const EMAIL_PATTERN =
  /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;
const PHONE_PATTERN =
  /(?:\+?\d[\d\s().-]{6,}\d)/i;

const SEVERITY_SCORE: Record<ModerationSeverity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

function normalizeMessageContent(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;
}

function collectMatches(content: string, patterns: RegExp[]) {
  const matches = new Set<string>();

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[0]) {
      matches.add(match[0].trim());
    }
  }

  return [...matches];
}

function chooseHighestSeveritySignal(signals: MessageModerationSignal[]) {
  return [...signals].sort((left, right) => {
    const severityDelta =
      SEVERITY_SCORE[right.severity] - SEVERITY_SCORE[left.severity];

    if (severityDelta !== 0) {
      return severityDelta;
    }

    const strikeDelta = right.strikeWeight - left.strikeWeight;
    if (strikeDelta !== 0) {
      return strikeDelta;
    }

    if (left.reviewRequired === right.reviewRequired) return 0;
    return left.reviewRequired ? -1 : 1;
  })[0];
}

async function getOrCreateAiModeratorIdentity(db: PrismaClient) {
  const existing = await db.moderatorIdentity.findFirst({
    where: {
      type: ModeratorIdentityType.AI,
      isActive: true,
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return existing;
  }

  return db.moderatorIdentity.create({
    data: {
      type: ModeratorIdentityType.AI,
      displayName: "NexaMart AI Moderator",
      isActive: true,
    },
    select: { id: true },
  });
}

async function resolveMessageModerationTarget(
  db: PrismaClient,
  messageId: string,
): Promise<MessageModerationTarget | null> {
  return db.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      conversationId: true,
      senderId: true,
      senderType: true,
      content: true,
      createdAt: true,
      conversation: {
        select: {
          id: true,
          type: true,
          subject: true,
          storeId: true,
          productId: true,
        },
      },
    },
  });
}

async function detectSpamSignal(
  db: PrismaClient,
  target: MessageModerationTarget,
  normalizedContent: string,
): Promise<MessageModerationSignal | null> {
  if (!target.senderId) {
    return null;
  }

  const recentMessages = await db.message.findMany({
    where: {
      senderId: target.senderId,
      senderType: SenderType.USER,
      conversationId: target.conversationId,
      id: { not: target.id },
      createdAt: {
        gte: new Date(target.createdAt.getTime() - 1000 * 60 * 60 * 24),
      },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      content: true,
    },
  });

  const repeatedCount = recentMessages.filter((message) => {
    return normalizeMessageContent(message.content) === normalizedContent;
  }).length;

  const repeatedContactPrompts = collectMatches(target.content, [
    ...CONTACT_ACTION_PATTERNS,
    ...CONTACT_PLATFORM_PATTERNS,
  ]);

  if (repeatedCount >= 2) {
    return {
      code: "MESSAGE_SPAM_REPEAT",
      matches: [
        `repeat-count:${repeatedCount + 1}`,
        truncateText(target.content, 120),
      ],
      severity: "MEDIUM",
      decision: "FLAG",
      strikeWeight: 1,
      reviewRequired: false,
      reason: "Message repeats the same solicitation pattern in a short window.",
    };
  }

  if (repeatedContactPrompts.length >= 2 && recentMessages.length >= 2) {
    return {
      code: "MESSAGE_SPAM_SOLICITATION",
      matches: repeatedContactPrompts,
      severity: "MEDIUM",
      decision: "FLAG",
      strikeWeight: 1,
      reviewRequired: false,
      reason:
        "Message repeats contact-solicitation phrases that resemble spam outreach.",
    };
  }

  return null;
}

async function evaluateMessageRules(
  db: PrismaClient,
  target: MessageModerationTarget,
): Promise<MessageModerationOutcome | null> {
  const normalizedContent = normalizeMessageContent(target.content);
  if (!normalizedContent) {
    return null;
  }

  const signals: MessageModerationSignal[] = [];

  const contactSignals = [
    ...collectMatches(target.content, CONTACT_PLATFORM_PATTERNS),
    ...collectMatches(target.content, CONTACT_ACTION_PATTERNS),
  ];
  const hasDirectContactHandle =
    EMAIL_PATTERN.test(target.content) || PHONE_PATTERN.test(target.content);

  if (contactSignals.length > 0 && hasDirectContactHandle) {
    signals.push({
      code: "MESSAGE_OFF_PLATFORM_CONTACT",
      matches: [
        ...contactSignals,
        EMAIL_PATTERN.test(target.content) ? "email" : "phone-number",
      ],
      severity: "HIGH",
      decision: "ESCALATE",
      strikeWeight: 2,
      reviewRequired: true,
      reason:
        "Message attempts to move communication off-platform using direct contact details.",
    });
  }

  const paymentSignals = [
    ...collectMatches(target.content, PAYMENT_DIVERSION_PATTERNS),
    ...collectMatches(target.content, PAYMENT_PROVIDER_PATTERNS),
  ];

  if (paymentSignals.length >= 2) {
    signals.push({
      code: "MESSAGE_OFF_PLATFORM_PAYMENT",
      matches: paymentSignals,
      severity: "HIGH",
      decision: "ESCALATE",
      strikeWeight: 2,
      reviewRequired: true,
      reason:
        "Message appears to solicit payment outside NexaMart's protected checkout flow.",
    });
  }

  const scamSignals = collectMatches(target.content, SCAM_PATTERNS);
  if (scamSignals.length > 0) {
    signals.push({
      code: "MESSAGE_SCAM_LANGUAGE",
      matches: scamSignals,
      severity: "CRITICAL",
      decision: "ESCALATE",
      strikeWeight: 3,
      reviewRequired: true,
      reason:
        "Message contains scam-indicative language that requires moderator review.",
    });
  }

  const threatSignals = collectMatches(target.content, THREAT_PATTERNS);
  if (threatSignals.length > 0) {
    signals.push({
      code: "MESSAGE_ABUSIVE_THREAT",
      matches: threatSignals,
      severity: "HIGH",
      decision: "ESCALATE",
      strikeWeight: 2,
      reviewRequired: true,
      reason:
        "Message contains threatening or severe abusive language toward another user.",
    });
  } else {
    const abusiveSignals = collectMatches(target.content, ABUSIVE_PATTERNS);
    if (abusiveSignals.length > 0) {
      signals.push({
        code: "MESSAGE_ABUSIVE_LANGUAGE",
        matches: abusiveSignals,
        severity: "MEDIUM",
        decision: "WARN",
        strikeWeight: 1,
        reviewRequired: false,
        reason:
          "Message contains abusive language that violates marketplace conduct expectations.",
      });
    }
  }

  const spamSignal = await detectSpamSignal(db, target, normalizedContent);
  if (spamSignal) {
    signals.push(spamSignal);
  }

  const primarySignal = chooseHighestSeveritySignal(signals);
  if (!primarySignal) {
    return null;
  }

  return {
    policyCode: primarySignal.code,
    severity: primarySignal.severity,
    decision: primarySignal.decision,
    strikeWeight: primarySignal.strikeWeight,
    reviewRequired: primarySignal.reviewRequired,
    confidence: 0.96,
    reason: primarySignal.reason,
    matchedSignals: primarySignal.matches,
    source: "RULES",
  };
}

function shouldRunAiMessageModeration(content: string) {
  return /(?:contact|call|reach|whatsapp|telegram|instagram|pay|transfer|deposit|refund|scam|fraud|idiot|stupid)/i.test(
    content,
  );
}

function parseAiModerationResponse(text: string): MessageModerationOutcome | null {
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) {
    return null;
  }

  try {
    const parsed = JSON.parse(match[0]) as {
      flagged?: boolean;
      policyCode?: string;
      severity?: ModerationSeverity;
      decision?: ModerationDecision;
      strikeWeight?: number;
      reviewRequired?: boolean;
      confidence?: number;
      reason?: string;
      matchedSignals?: string[];
    };

    if (!parsed.flagged) {
      return null;
    }

    if (
      !parsed.policyCode ||
      !parsed.severity ||
      !parsed.decision ||
      typeof parsed.strikeWeight !== "number" ||
      typeof parsed.reviewRequired !== "boolean" ||
      typeof parsed.reason !== "string"
    ) {
      return null;
    }

    return {
      policyCode: parsed.policyCode,
      severity: parsed.severity,
      decision: parsed.decision,
      strikeWeight: Math.max(0, Math.round(parsed.strikeWeight)),
      reviewRequired: parsed.reviewRequired,
      confidence:
        typeof parsed.confidence === "number"
          ? Math.min(1, Math.max(0, parsed.confidence))
          : 0.72,
      reason: truncateText(parsed.reason.trim(), 500),
      matchedSignals: Array.isArray(parsed.matchedSignals)
        ? parsed.matchedSignals
            .filter((value): value is string => typeof value === "string")
            .slice(0, 8)
        : [],
      source: "AI",
    };
  } catch {
    return null;
  }
}

async function evaluateMessageWithAi(
  target: MessageModerationTarget,
): Promise<MessageModerationOutcome | null> {
  if (!moderationClient || !shouldRunAiMessageModeration(target.content)) {
    return null;
  }

  try {
    const response = await moderationClient.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You are NexaMart's marketplace moderation classifier. Review user-to-user marketplace messages for off-platform payment, off-platform contact diversion, scam language, abuse, harassment, or spam. Return JSON only.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Classify this message.

Conversation type: ${target.conversation.type}
Conversation subject: ${target.conversation.subject ?? "N/A"}
Message: ${target.content}

Return JSON only:
{
  "flagged": true | false,
  "policyCode": "MESSAGE_OFF_PLATFORM_CONTACT | MESSAGE_OFF_PLATFORM_PAYMENT | MESSAGE_SCAM_LANGUAGE | MESSAGE_ABUSIVE_LANGUAGE | MESSAGE_SPAM",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "decision": "ALLOW | WARN | FLAG | HIDE | SOFT_BLOCK | ESCALATE | NO_ACTION",
  "strikeWeight": 0 | 1 | 2 | 3,
  "reviewRequired": true | false,
  "confidence": 0.0,
  "reason": "short explanation",
  "matchedSignals": ["signal"]
}`,
            },
          ],
        },
      ],
    });

    return parseAiModerationResponse(response.output_text);
  } catch (error) {
    console.error("Message moderation AI failed", error);
    return null;
  }
}

async function evaluateMessageModeration(
  db: PrismaClient,
  target: MessageModerationTarget,
) {
  const rulesOutcome = await evaluateMessageRules(db, target);
  if (rulesOutcome) {
    return rulesOutcome;
  }

  return evaluateMessageWithAi(target);
}

function buildIncidentEvidence(
  target: MessageModerationTarget,
  outcome: MessageModerationOutcome,
): Prisma.InputJsonObject {
  return {
    messageId: target.id,
    conversationId: target.conversationId,
    excerpt: truncateText(target.content, 280),
    matchedSignals: outcome.matchedSignals,
    createdAt: target.createdAt.toISOString(),
  };
}

function buildIncidentMetadata(
  target: MessageModerationTarget,
  outcome: MessageModerationOutcome,
): Prisma.InputJsonObject {
  return {
    evaluationSource: outcome.source,
    senderType: target.senderType,
    senderId: target.senderId,
    conversationType: target.conversation.type,
    conversationSubject: target.conversation.subject,
    productId: target.conversation.productId,
    storeId: target.conversation.storeId,
    matchedSignals: outcome.matchedSignals,
  };
}

export async function moderateMessageAfterCreate(
  db: PrismaClient,
  message: {
    id: string;
    conversationId: string;
    senderId: string | null;
    senderType: SenderType;
    content: string;
    createdAt: Date;
  },
) {
  if (message.senderType !== SenderType.USER || !message.senderId) {
    return null;
  }

  const target = await resolveMessageModerationTarget(db, message.id);
  if (!target || target.senderType !== SenderType.USER || !target.senderId) {
    return null;
  }

  const outcome = await evaluateMessageModeration(db, target);
  if (!outcome) {
    return null;
  }

  const now = new Date();
  const aiModerator = await getOrCreateAiModeratorIdentity(db);

  const existingIncident = await db.moderationIncident.findFirst({
    where: {
      targetType: ModerationTargetType.MESSAGE,
      targetId: target.id,
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  const incidentPayload = {
    targetType: ModerationTargetType.MESSAGE,
    targetId: target.id,
    subjectUserId: target.senderId,
    actorModeratorId: aiModerator.id,
    decision: outcome.decision,
    severity: outcome.severity,
    confidence: outcome.confidence,
    policyCode: outcome.policyCode,
    reason: outcome.reason,
    evidence: buildIncidentEvidence(target, outcome),
    metadata: buildIncidentMetadata(target, outcome),
    strikeWeight: outcome.strikeWeight,
    reviewStatus: outcome.reviewRequired
      ? ReviewStatus.PENDING_HUMAN_REVIEW
      : ReviewStatus.NOT_REQUIRED,
    status: outcome.reviewRequired ? "OPEN" : "RESOLVED",
    resolvedAt: outcome.reviewRequired ? null : now,
  } satisfies Prisma.ModerationIncidentUncheckedCreateInput;

  const incident = existingIncident
    ? await db.moderationIncident.update({
        where: { id: existingIncident.id },
        data: incidentPayload,
        select: { id: true },
      })
    : await db.moderationIncident.create({
        data: incidentPayload,
        select: { id: true },
      });

  await createAuditLog(
    {
      actorId: null,
      actorRole: UserRole.SYSTEM,
      actionType: "MESSAGE_MODERATION_INCIDENT_CREATED",
      targetEntityType: "MODERATION_INCIDENT",
      targetEntityId: incident.id,
      summary: `Automated moderation flagged message ${target.id}.`,
      metadata: {
        targetType: "MESSAGE",
        targetId: target.id,
        policyCode: outcome.policyCode,
        severity: outcome.severity,
        decision: outcome.decision,
        reviewRequired: outcome.reviewRequired,
        source: outcome.source,
      },
    },
    db,
  );

  if (!outcome.reviewRequired && outcome.strikeWeight > 0) {
    const enforcement = await applyModerationEnforcement(db, {
      userId: target.senderId,
      strikeWeight: outcome.strikeWeight,
      severity: outcome.severity,
      now,
    });

    if (enforcement.applied) {
      await createAuditLog(
        {
          actorId: null,
          actorRole: UserRole.SYSTEM,
          actionType: "MESSAGE_MODERATION_ENFORCED",
          targetEntityType: "USER",
          targetEntityId: target.senderId,
          summary: `Automated moderation applied enforcement for message ${target.id}.`,
          metadata: {
            incidentId: incident.id,
            messageId: target.id,
            strikeWeight: outcome.strikeWeight,
            moderationState: enforcement.moderationState,
            strikeCount: enforcement.strikeCount,
            riskScore: enforcement.riskScore,
            softBlockedUntil: enforcement.softBlockedUntil?.toISOString() ?? null,
          },
        },
        db,
      );
    }
  }

  return {
    incidentId: incident.id,
    reviewRequired: outcome.reviewRequired,
    policyCode: outcome.policyCode,
  };
}
