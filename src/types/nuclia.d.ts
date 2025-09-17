declare global {
  namespace JSX {
    interface IntrinsicElements {
      'nuclia-search-bar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        audit_metadata?: string;
        knowledgebox?: string;
        zone?: string;
        state?: string;
        account?: string;
        kbslug?: string;
        apikey?: string;
        backend?: string;
        cdn?: string;
        features?: string;
        rag_strategies?: string;
        feedback?: string;
        onfocus?: () => void;
      };
      'nuclia-search-results': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export {};
