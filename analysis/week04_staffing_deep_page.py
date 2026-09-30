"""Week 4, section 3 deep dive: the figures the page's own JSON does not carry.

Section 3's first-round questions (who-q1 to who-q4), the law-firm question
and the lottery question already have every number in an existing analysis
JSON (week04_staffing.json, week04_lawfirms.json, week04_lottery.json,
week04_shift.json), but those files sit outside public/ and are not fetched at
runtime. This script copies the handful of fields week04-vis-staffing.js
draws that no page file under public/ already carries. Fields already on a
page (public/weeks/week04/data/staffing_communities.json's modularity,
industry_or_vendor and stability; public/weeks/week04/data/years.json's
uscis_series) are read straight from there instead of duplicated here.

Owner: Gyula. Outputs: public/weeks/week04/data/staffing_deep.json.
"""

import json
from pathlib import Path

from week04_schemas import check

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "public/weeks/week04/data/staffing_deep.json"


def load(rel):
    return json.loads((ROOT / rel).read_text())


def main():
    staffing = load("analysis/week04_staffing.json")
    lottery = load("analysis/week04_lottery.json")["lotteries"]
    shift = load("analysis/week04_shift.json")
    lawfirms = load("analysis/week04_lawfirms.json")
    ties = load("analysis/week04_ties.json")

    main_ = staffing["main"]
    l24 = lottery["2024"]
    ct = l24["community_test"]["unweighted"]
    ct23 = lottery["2023"]["community_test"]["unweighted"]
    jj = shift["jan_jun"]
    before, after = jj["client_churn"]["pairs"]
    outsourcing = lawfirms["outsourcing"]
    top_firms = lawfirms["years"]["2025"]["concentration"]["top_firms_by_filings"][:5]
    wt = ties["weak_ties"]["2025"]
    wage = ties["wage"]["wage_distribution_placing_vs_direct_filings"]

    fy25 = staffing["years"]["2025"]
    page = {
        "generated_by": "analysis/week04_staffing_deep_page.py",
        "q1": {
            "client_company_share": fy25["client_company_share"],
            "by_kind": {
                kind: {
                    "registrations_per_approval": l24["by_kind"][kind]["registrations_per_approval"],
                    "selected_that_became_petitions": l24["by_kind"][kind]["selected_that_became_petitions"],
                }
                for kind in ("direct", "placing", "small")
            },
        },
        "q3": {
            "clients": main_["clients"],
            "single_vendor_clients": main_["single_vendor_clients"],
            "single_vendor_filing_share": main_["single_vendor_filing_share"],
            "big_clients": main_["big_clients"],
            "big_clients_over_90pct_one_vendor": main_["big_clients_over_90pct_one_vendor"],
            "big_clients_median_top_vendor_share": main_["big_clients_median_top_vendor_share"],
        },
        "q4": {
            "jan_jun_change": {
                "certified_filings_percent": {
                    "fy24_to_fy25": jj["totals_change"]["fy24_to_fy25"]["certified_filings"]["percent"],
                    "fy25_to_fy26": jj["totals_change"]["fy25_to_fy26"]["certified_filings"]["percent"],
                },
                "client_company_filings_percent": {
                    "fy24_to_fy25": jj["totals_change"]["fy24_to_fy25"]["client_company_filings"]["percent"],
                    "fy25_to_fy26": jj["totals_change"]["fy25_to_fy26"]["client_company_filings"]["percent"],
                },
                "main_vendor_changed_share": {"before": before["main_vendor_changed_share"],
                                               "after": after["main_vendor_changed_share"]},
            },
        },
        "lawyers": {
            "outsourcing": {
                "placing": {"no_firm_share_pooled": outsourcing["placing"]["no_firm_share_pooled"],
                            "top5_share_pooled": outsourcing["placing"]["top5_share_pooled"]},
                "direct": {"no_firm_share_pooled": outsourcing["direct"]["no_firm_share_pooled"],
                           "top5_share_pooled": outsourcing["direct"]["top5_share_pooled"]},
            },
            "top_firms_by_filings": top_firms,
        },
        "ties": {
            "spearman_weight_overlap_rho": wt["spearman_weight_overlap"]["rho"],
            "weight_shuffle_null": {"mean_rho": wt["weight_shuffle_null"]["mean_rho"],
                                     "sd_rho": wt["weight_shuffle_null"]["sd_rho"]},
            "defined_links": wt["defined_links"],
            "wage_distribution_placing_vs_direct_filings": wage,
        },
        "lottery": {
            "high_mates_share": ct["high_mates_share"],
            "high_mates_share_shuffled": ct["high_mates_share_shuffled"],
            "ami_median": ct["ami_median"],
            "ami_min": ct["ami_min"],
            "ami_max": ct["ami_max"],
            "previous_year": {"high_mates_share": ct23["high_mates_share"],
                               "high_mates_share_shuffled": ct23["high_mates_share_shuffled"]},
        },
    }
    check(PAGE, page)
    PAGE.write_text(json.dumps(page, indent=1) + "\n")
    print(f"wrote {PAGE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
