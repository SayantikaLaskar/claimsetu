import { MEMBERS } from "../src/lib/data/members";
import { buildPassbook, summarise } from "../src/lib/passbook";

for (const uan of ["900000000001", "900000000004"]) {
  const y = buildPassbook(MEMBERS[uan], "2026-08-24");
  const s = summarise(y);
  console.log(`\n${MEMBERS[uan].epfoName}  (record says ₹${MEMBERS[uan].pfBalance.toLocaleString("en-IN")})`);
  console.log(`  passbook EPF balance : ₹${s.epfBalance.toLocaleString("en-IN")}`);
  console.log(`  pension fund         : ₹${s.pensionFundTotal.toLocaleString("en-IN")}`);
  console.log(`  interest credited    : ₹${s.totalInterest.toLocaleString("en-IN")}`);
  console.log(`  MISSING              : ₹${s.missingAmount.toLocaleString("en-IN")} across ${s.missingMonths.length} months ${s.missingMonths.join(", ")}`);
  console.log(`  years                : ${y.map((x) => x.year).join(", ")}`);
}
