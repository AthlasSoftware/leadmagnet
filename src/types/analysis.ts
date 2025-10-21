export interface AnalysisResults {
  accessibility: AccessibilityResults;
  seo: SEOResults;
  design: DesignResults;
  overview: OverviewResults;
}

export interface AccessibilityResults {
  score: number;
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    element?: string;
    recommendation: string;
  }>;
  strengths: string[];
}

export interface SEOResults {
  score: number;
  technical: {
    loadSpeed: number;
    mobileOptimized: boolean;
    httpsEnabled: boolean;
    hasRobotsTxt: boolean;
    hasSitemap: boolean;
  };
  onPage: {
    hasUniqueTitle: boolean;
    hasMetaDescription: boolean;
    hasH1: boolean;
    headerStructure: string[];
    imagesWithAlt: number;
    totalImages: number;
  };
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    recommendation: string;
  }>;
}

export interface DesignResults {
  score: number;
  responsive: boolean;
  loadTime: number;
  colorContrast: {
    sufficient: boolean;
    ratio: number;
  };
  typography: {
    readable: boolean;
    hierarchy: boolean;
  };
  navigation: {
    clear: boolean;
    accessible: boolean;
  };
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    recommendation: string;
  }>;
}

export interface OverviewResults {
  overallScore: number;
  summary: string;
  priorityIssues: string[];
  quickWins: string[];
}
