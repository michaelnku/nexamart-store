export type VerificationStep = {
  id: string;
  label: string;
  completed: boolean;
};

export type VerificationProgressType = {
  progress: number;
  steps: VerificationStep[];
};
