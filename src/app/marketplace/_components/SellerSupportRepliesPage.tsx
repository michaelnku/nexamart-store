"use client";

import {
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const tickets = [
  {
    id: "SUP-1021",
    subject: "Payout delay for Order #NX-4021",
    status: "Resolved",
    lastReply: "Support Team",
    updatedAt: "Aug 14, 2025",
  },
  {
    id: "SUP-1022",
    subject: "Product approval pending",
    status: "Open",
    lastReply: "You",
    updatedAt: "Aug 15, 2025",
  },
  {
    id: "SUP-1023",
    subject: "Store verification review",
    status: "Waiting",
    lastReply: "Support Team",
    updatedAt: "Aug 16, 2025",
  },
];

const statusBadge = (status: string) => {
  switch (status) {
    case "Resolved":
      return (
        <span
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full
          bg-green-100 text-green-700 font-medium"
        >
          <CheckCircle className="w-3 h-3" />
          Resolved
        </span>
      );
    case "Waiting":
      return (
        <span
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full
          bg-amber-100 text-amber-700 font-medium"
        >
          <Clock className="w-3 h-3" />
          Waiting
        </span>
      );
    default:
      return (
        <span
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full
          bg-blue-100 text-blue-700 font-medium"
        >
          <AlertCircle className="w-3 h-3" />
          Open
        </span>
      );
  }
};

export default function SellerSupportRepliesPage() {
  return (
    <div className="space-y-6">
      {/* ───────── HEADER ───────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Support Center</h1>
          <p className="text-sm text-gray-500">
            View replies and updates from NexaMart Support
          </p>
        </div>

        <Button className="bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] gap-2">
          <MessageCircle className="w-4 h-4" />
          New Support Ticket
        </Button>
      </div>

      {/* ───────── FILTER BAR ───────── */}
      <Card className="border shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by ticket ID or subject..."
              className="pl-9"
            />
          </div>

          <select className="border rounded-md px-3 py-2 text-sm">
            <option>All status</option>
            <option>Open</option>
            <option>Waiting</option>
            <option>Resolved</option>
          </select>
        </CardContent>
      </Card>

      {/* ───────── TICKETS TABLE ───────── */}
      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <div className="p-5">
            <h2 className="text-lg font-semibold">Your Support Tickets</h2>
          </div>

          <Separator />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Ticket ID</th>
                  <th className="px-5 py-3 text-left font-medium">Subject</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">
                    Last Reply
                  </th>
                  <th className="px-5 py-3 text-left font-medium">
                    Last Updated
                  </th>
                  <th className="px-5 py-3 text-left font-medium"></th>
                </tr>
              </thead>

              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b last:border-b-0 hover:bg-gray-50 transition"
                  >
                    <td className="px-5 py-3 font-medium text-[var(--brand-blue)]">
                      {ticket.id}
                    </td>
                    <td className="px-5 py-3">{ticket.subject}</td>
                    <td className="px-5 py-3">{statusBadge(ticket.status)}</td>
                    <td className="px-5 py-3">{ticket.lastReply}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {ticket.updatedAt}
                    </td>
                    <td className="px-5 py-3">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
