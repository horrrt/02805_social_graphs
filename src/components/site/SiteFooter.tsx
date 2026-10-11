// The footer of the corridor-styled pages: footer.foot > div.shell around the
// page's own spans (credits, the page's name and the link home), which the page
// writes as children with their {" "} separators.
import type { ReactNode } from "react";

export function SiteFooter({ children }: { children: ReactNode }) {
  return (
    <footer className="foot">
      <div className="shell">{children}</div>
    </footer>
  );
}
