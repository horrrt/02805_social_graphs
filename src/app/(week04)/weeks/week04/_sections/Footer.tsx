// The page footer with the sources and the O*NET credit.
export function Footer() {
  return (
    <footer className="foot">
      <div className="shell">
        <span>
          Sources: US DOL OFLC LCA / worksites (public domain) · Census CBSA
          delineations · Week 4 methods: communities, weights, backbones
        </span>
        {" "}
        <span>
          This page includes information from the O*NET® 31.0 Database and, for two
          occupations, the O*NET® 25.0 Database by the U.S. Department of Labor,
          Employment and Training Administration (USDOL/ETA). Used under the
          {" "}
          <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0 license</a>
          .
          Log–Log Legends has modified all or some of this information. USDOL/ETA has
          not approved, endorsed, or tested these modifications.
        </span>
        {" "}
        <span>
          Registrations per lottery draw: USCIS,
          {" "}
          <a href="https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations/h-1b-electronic-registration-process">H-1B Electronic Registration Process</a>
          , Historical Data
          (public domain).
        </span>
        {" "}
        <span>
          Who hires America's foreign workers? ·
          {" "}
          <a href="../../">Log–Log Legends</a>
          {" "}
          · DTU 02805
        </span>
      </div>
    </footer>
  );
}
