export interface ScanResult {
  lastDate: Date | null;
  lastFileName: string | null;
  totalJournals: number;
}

export interface CreateResult {
  success: boolean;
  filesCreated: number;
  message: string;
  dateRange: {
    start: Date;
    end: Date;
  } | null;
}

