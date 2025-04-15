export interface FAQCategory {
  title: string;
  slug: string;
  public: boolean;
  ordering: number;
}

export interface FAQ {
  question: string;
  answer: string;
  public: boolean;
  ordering: number;
  category: FAQCategory;
  slug: string;
}
