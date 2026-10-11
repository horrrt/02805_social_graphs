// The footer: sources and licences.
export function Footer() {
  return (
    <>
      <footer className="foot">
        <div className="shell">
          <span>
            Sources: UN DESA International Migrant Stock (Rev. 2024) ·
            UNHCR Refugee Population Statistics Database (end-2024, CC BY 4.0) ·
            World Bank, World Development Indicators (CC BY 4.0) ·
            US BTS T-100 International Segment (public domain) ·
            Eurostat, asylum applicants by citizenship, monthly (migr_asyappctzm, CC BY 4.0;
            we kept first-time applicants and summed them across destinations) ·
            Oxford Covid-19 Government Response Tracker, Blavatnik School of Government,
            University of Oxford (CC BY 4.0) ·
            OpenFlights routes (air access proxy, undated snapshot), under the
            {" "}
            <a href="https://opendatacommons.org/licenses/odbl/1-0/">Open Database License</a>
            ;
            our country-to-country route counts are offered under the same licence ·
            Natural Earth 1:110m country outlines (public domain) ·
            Globe imagery: NASA Visible Earth,
            {" "}
            <a href="https://visibleearth.nasa.gov/collection/1484/blue-marble">Blue Marble</a>
            {" "}
            ·
            {" "}
            <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>
          </span>
          {" "}
          <span>
            Corridor Control ·
            {" "}
            <a href="../../">Log–Log Legends</a>
            {" "}
            · DTU 02805
          </span>
        </div>
      </footer>
    </>
  );
}
