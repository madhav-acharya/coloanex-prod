export interface KycDocument {
  id: string;
  type: string;
  url: string;
  status: string;
  uploadedAt: string;
}

export interface KycSubmission {
  lenderId: string;
  loanType: string;
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    nationalId: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
  };
  documents: {
    governmentId?: string;
    proofOfAddress?: string;
  };
  employment: {
    status: string;
    employerName?: string;
    monthlyIncome: number;
  };
  consent: boolean;
}

export interface KycStatus {
  id: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  notes?: string;
}
