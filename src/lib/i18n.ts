/**
 * Interface language.
 *
 * Two things are separated here on purpose. Chrome — buttons, headings, the
 * words that never change — is hand-translated and shipped in the bundle, so it
 * is correct and costs nothing to render. Rule explanations, which run to
 * thousands of words across 26 rules, are translated on demand by a model and
 * cached (see src/lib/translate.ts). Hand-maintaining 26 rules × 8 languages
 * would guarantee that the translations rot; generating them guarantees they
 * exist at all.
 */

/**
 * Languages the interface actually ships in.
 *
 * This list was eight entries long and six of them changed only the buttons,
 * leaving every rule explanation in English. That is worse than offering two,
 * because a member who picks Tamil and gets an English page has been told the
 * product is not for them. The six are named on /integration as the concrete
 * thing a one-time model translation pass would unlock, with the cost attached.
 */
export const LOCALES = {
  en: { label: "English", native: "English", short: "EN" },
  hi: { label: "Hindi", native: "हिन्दी", short: "हि" },
} as const;

/** Named on the integration page as pending, not offered as if they worked. */
export const PENDING_LOCALES = [
  "বাংলা", "मराठी", "தமிழ்", "తెలుగు", "ಕನ್ನಡ", "ગુજરાતી",
] as const;

export type Locale = keyof typeof LOCALES;
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(v: string | undefined): v is Locale {
  return !!v && v in LOCALES;
}

type Dict = Record<string, string>;

const en: Dict = {
  "app.name": "ClaimSetu",
  "app.tagline": "Know before you file",

  "home.headline": "Your PF is your money. Find out why it will not come.",
  "home.sub":
    "One in five EPF claims is rejected. The reason usually arrives three weeks later, as a code. This checks the same things EPFO checks — before you file.",
  "home.pick": "Pick a member record to try",
  "home.pickNote":
    "Real ClaimSetu would read your own record after an Aadhaar OTP. These five are invented, and each one fails in a different way.",
  "home.start": "Check this record",
  "home.howItWorks": "How this is different from the EPFO portal",

  "need.title": "What do you need to do?",
  "need.sub": "In your own words. We will work out which form that is.",
  "need.formIs": "EPFO calls this",
  "need.amount": "How much do you need?",
  "need.amountNote": "Enter the amount in rupees",
  "need.purpose": "What is the money for?",
  "need.continue": "Check my claim",

  "check.title": "Pre-flight check",
  "check.for": "for",
  "check.go.title": "Nothing is blocking this claim",
  "check.go.body":
    "Every check EPFO runs at the point of filing passes on your record. File it.",
  "check.fix.title": "This claim would be rejected",
  "check.fix.body": "Fix these first. We have drafted what each one needs.",
  "check.notEligible.title": "This is the wrong claim for you",
  "check.notEligible.body":
    "Not a records problem — the rules do not allow this claim in your situation. Here is what does apply.",
  "check.atStake": "At stake",
  "check.readyIn": "Ready to file in about",
  "check.days": "working days",
  "check.today": "today",
  "check.blockers": "Will cause rejection",
  "check.risks": "Will cost you money or time",
  "check.advisories": "Worth knowing",
  "check.passed": "checks passed",
  "check.passedShow": "Show every check we ran",
  "check.whoFixes": "Who has to fix this",
  "check.howLong": "Usually takes",
  "check.epfoSays": "What EPFO's rejection will say",
  "check.basis": "Based on",
  "check.fixIt": "How to fix it",
  "check.generate": "Prepare this for me",
  "check.simplified": "Simplified in this prototype",

  "actor.MEMBER": "You",
  "actor.EMPLOYER": "Your employer",
  "actor.EPFO": "The EPFO office",
  "actor.BANK": "Your bank",

  "nav.back": "Back",
  "nav.language": "Language",
  "foot.built": "Prototype for the Build What Moves India brief. Rules derived from published EPFO scheme paragraphs and the Citizen's Charter; member records synthetic. No live government system is contacted.",

  "rec.noteName": "Matched letter by letter. An initial where the other spells the word out is a mismatch.",
  "rec.noteDob": "Also sets the date your pension becomes payable.",
  "rec.noteRelation": "Blocks pension and insurance claims rather than withdrawals.",
  "rec.bank": "Bank",
  "rec.kyc1": "Aadhaar linked and verified",
  "rec.kyc1n": "Pending is not linked. Every claim fails until your employer approves it.",
  "rec.kyc2": "PAN verified",
  "rec.kyc2n": "Without it, tax is 20% flat on withdrawals under five years of service.",
  "rec.kyc3": "Bank account verified",
  "rec.kyc4": "Mobile registered against Aadhaar",
  "rec.kyc4n": "The claim OTP goes here, not to the number on your EPFO profile.",
  "rec.kyc5": "Nominee filed",
  "rec.kyc5n": "Without one, your family needs a court certificate instead of a claim form.",
  "rec.pensionScheme": "Pension scheme",
  "rec.transferredIn": "Transferred in",
  "rec.notDeposited": "months not deposited",
  "rec.otherUan": "Another PF number exists in your name",
  "rec.otherUanBody": "The service under it is not counted above, which understates how long you have worked.",

  "pb.sub": "Every month you worked, and what actually arrived. You pay 12% of wages; your employer pays 12%, of which 8.33% goes to the pension fund up to the ₹15,000 ceiling.",
  "pb.missingBanner": "was deducted from your wages and never reached EPFO.",
  "pb.missingBanner2": "Those months are shown below in red. The real passbook does not print them at all — it prints only what arrived, so a theft looks like a month you did not work.",
  "pb.simplified": "Simplified.",
  "pb.simplifiedBody": "Interest is credited once a year on the opening balance plus half the year's additions. EPFO computes it on a monthly running balance, so real figures differ slightly. Wages are held flat within each employment rather than stepped by annual increment.",

  "trk.title": "My claims",
  "trk.empty": "Nothing filed yet in this session. This prototype keeps no history between visits — a real portal would list every claim you have ever made, with the stage each one reached and why any of them failed.",
  "trk.checkClaim": "Check a claim",
  "trk.withEpfo": "Your claim is with EPFO",
  "trk.settled": "Settled",
  "trk.settledOn": "Settled on day",
  "trk.pastDeadline": "days past EPFO's own deadline",
  "trk.dayOf": "Day",
  "trk.of": "of",
  "trk.settledBody": "The money has reached your bank account.",
  "trk.breachedBody": "EPFO's Citizen's Charter commits to settling a complete claim in twenty working days. That has passed. You now have grounds to escalate, and the letter is drafted below.",
  "trk.onTrackBody": "left before you can escalate on those grounds.",
  "trk.onTrackLead": "EPFO's own commitment is twenty working days for a complete claim.",
  "trk.hereNow": "Here now",
  "trk.heldBy": "Held by:",
  "trk.usually": "usually",
  "trk.workingDay": "working day",
  "trk.workingDays": "working days",
  "trk.escalationReady": "Your escalation letter is ready",
  "trk.copyLetter": "Copy the letter",
  "trk.protoControl": "Prototype control",
  "trk.protoBody": "No claim was filed anywhere. Jump the clock forward to see the same claim later, including once EPFO's own deadline has passed.",
  "trk.day": "Day",

  "sev.BLOCKER": "Blocks the claim",
  "sev.RISK": "Costs money or time",
  "sev.ADVISORY": "Worth knowing",
  "check.ruleSource": "Where this rule comes from",

  "rec.title": "My records",
  "rec.sub": "A claim moves only when EPFO, Aadhaar and your bank agree exactly. Here is what each of them holds.",
  "rec.field": "Field",
  "rec.agrees": "Agrees",
  "rec.yes": "yes",
  "rec.no": "no",
  "rec.name": "Name",
  "rec.dob": "Date of birth",
  "rec.relation": "Father's / husband's name",
  "rec.gender": "Gender",
  "rec.verification": "Verification status",
  "rec.service": "Service EPFO has recorded",
  "rec.noExit": "no exit date recorded",
  "rec.fixOrder": "What to fix, in order",
  "rec.fixOrderSub": "Slowest first — those are the ones to start today.",
  "rec.nowCheck": "Now check a claim",

  "pb.title": "Passbook",
  "pb.month": "Month",
  "pb.wage": "Wage",
  "pb.yours": "Yours",
  "pb.employer": "Employer",
  "pb.pension": "Pension",
  "pb.depositedYear": "Deposited this year",
  "pb.interestCredited": "Interest credited",
  "pb.closing": "Closing balance",
  "pb.neverDeposited": "deducted from wages, never deposited",
  "pb.missing": "missing",

  "nav.signOut": "Sign out",

  "dash.lastWorked": "Last worked at",
  "dash.currentlyAt": "Currently at",
  "dash.balance": "Provident fund balance",
  "dash.pensionFund": "Pension fund",
  "dash.interest": "Interest earned",
  "dash.years": "Years recorded",
  "dash.missingTitle": "Deducted from your wages, never received by EPFO",
  "dash.missingBody": "The real passbook omits these rows entirely, and an absence is not something you can notice.",
  "dash.missingCta": "See the months",
  "dash.months": "months",
  "dash.record": "Your record",
  "dash.clean": "Nothing about your record stands in the way.",
  "dash.cleanBody": "All record checks pass.",
  "dash.notClean": "Problems with your records, not with any one claim. Fix once, clears every claim.",
  "dash.blocking": "blocking",
  "dash.costly": "costly",
  "dash.toNote": "to note",
  "dash.passing": "passing",
  "dash.seeChecks": "See the checks",
  "dash.fixRecords": "Fix my records",
  "dash.whatDo": "What do you want to do?",
  "dash.a1h": "Claim my money",
  "dash.a1b": "Say it in your own words. Checked before anything is filed.",
  "dash.a2h": "See my passbook",
  "dash.a2b": "Every month, every employer, and what is missing.",
  "dash.a3h": "Check my records",
  "dash.a3b": "Where EPFO, Aadhaar and your bank disagree.",
  "dash.a4h": "Track a claim",
  "dash.a4b": "Which desk holds it, and the twenty-day clock.",
  "dash.recent": "Last few months",
  "dash.nothingReceived": "nothing received",

  "check.waitingOn": "Who you are waiting on",
  "check.waitingNote": "The EPFO portal shows none of this. A member who does not know an employer has to act waits indefinitely for a system that is itself waiting.",
  "check.checksRun": "Checks run",
  "check.thing": "thing",
  "check.things": "things",
  "check.fileIt": "File this claim",

  "need.orChoose": "Or choose",
  "need.beforeStart": "Before you start.",
  "need.beforeStartBody": "problems with your record will block any claim. The check below lists them",
  "need.orFixFirst": "or fix them first",
};

const hi: Dict = {
  "app.name": "ClaimSetu",
  "app.tagline": "फ़ॉर्म भरने से पहले जानिए",

  "home.headline": "पीएफ़ आपका पैसा है। जानिए क्यों नहीं आ रहा।",
  "home.sub":
    "हर पाँच में से एक ईपीएफ़ क्लेम रिजेक्ट होता है। कारण तीन हफ़्ते बाद, एक कोड की तरह आता है। यह वही जाँच पहले कर देता है, जो ईपीएफ़ओ बाद में करता है।",
  "home.pick": "देखने के लिए एक रिकॉर्ड चुनें",
  "home.pickNote":
    "असली ClaimSetu आधार ओटीपी के बाद आपका रिकॉर्ड पढ़ेगा। ये पाँच काल्पनिक हैं, और हर एक अलग वजह से फ़ेल होता है।",
  "home.start": "यह रिकॉर्ड जाँचें",
  "home.howItWorks": "यह ईपीएफ़ओ पोर्टल से कैसे अलग है",

  "need.title": "आपको क्या करना है?",
  "need.sub": "अपने शब्दों में बताइए। कौन सा फ़ॉर्म है, वह हम देख लेंगे।",
  "need.formIs": "ईपीएफ़ओ इसे कहता है",
  "need.amount": "कितने पैसे चाहिए?",
  "need.amountNote": "रुपये में रकम लिखें",
  "need.purpose": "पैसा किस काम के लिए है?",
  "need.continue": "मेरा क्लेम जाँचें",

  "check.title": "पहले की जाँच",
  "check.for": "—",
  "check.go.title": "इस क्लेम में कोई रुकावट नहीं है",
  "check.go.body":
    "ईपीएफ़ओ फ़ॉर्म जमा करते समय जो भी जाँचता है, वह सब आपके रिकॉर्ड पर पास है। भर दीजिए।",
  "check.fix.title": "यह क्लेम रिजेक्ट हो जाएगा",
  "check.fix.body": "पहले ये ठीक कराइए। हर एक के लिए काग़ज़ हमने तैयार कर दिया है।",
  "check.notEligible.title": "यह क्लेम आपके लिए सही नहीं है",
  "check.notEligible.body":
    "रिकॉर्ड की गड़बड़ी नहीं है — नियम आपकी स्थिति में यह क्लेम नहीं देते। जो लागू होता है, वह नीचे है।",
  "check.atStake": "दाँव पर",
  "check.readyIn": "जमा करने लायक होने में लगभग",
  "check.days": "कार्य दिवस",
  "check.today": "आज ही",
  "check.blockers": "इनसे क्लेम रिजेक्ट होगा",
  "check.risks": "इनसे पैसा या समय जाएगा",
  "check.advisories": "जान लेना ज़रूरी है",
  "check.passed": "जाँच पास हुईं",
  "check.passedShow": "हमने जो भी जाँचा, सब दिखाइए",
  "check.whoFixes": "किसे ठीक करना है",
  "check.howLong": "आम तौर पर लगता है",
  "check.epfoSays": "ईपीएफ़ओ का रिजेक्शन क्या कहेगा",
  "check.basis": "आधार",
  "check.fixIt": "कैसे ठीक करें",
  "check.generate": "मेरे लिए तैयार कर दें",
  "check.simplified": "इस प्रोटोटाइप में सरल किया गया",

  "actor.MEMBER": "आप",
  "actor.EMPLOYER": "आपका नियोक्ता",
  "actor.EPFO": "ईपीएफ़ओ कार्यालय",
  "actor.BANK": "आपका बैंक",

  "nav.back": "पीछे",
  "nav.language": "भाषा",
  "foot.built": "Build What Moves India के लिए बनाया गया प्रोटोटाइप। नियम ईपीएफ़ओ की प्रकाशित योजना-धाराओं और सिटिज़न्स चार्टर से लिए गए हैं; सदस्यों के रिकॉर्ड काल्पनिक हैं। किसी सरकारी सिस्टम से संपर्क नहीं होता।",

  "rec.noteName": "अक्षर-दर-अक्षर मिलाया जाता है। एक तरफ़ पूरा नाम और दूसरी तरफ़ सिर्फ़ अक्षर हो तो भी मेल नहीं माना जाता।",
  "rec.noteDob": "यही तय करती है कि पेंशन किस दिन से मिलेगी।",
  "rec.noteRelation": "इससे निकासी नहीं, पेंशन और बीमा के क्लेम रुकते हैं।",
  "rec.bank": "बैंक",
  "rec.kyc1": "आधार जुड़ा और वेरिफ़ाई",
  "rec.kyc1n": "Pending का मतलब जुड़ा नहीं। नियोक्ता की मंज़ूरी तक हर क्लेम फ़ेल होगा।",
  "rec.kyc2": "पैन वेरिफ़ाई",
  "rec.kyc2n": "इसके बिना पाँच साल से कम नौकरी पर निकासी में सीधे 20% टैक्स कटता है।",
  "rec.kyc3": "बैंक खाता वेरिफ़ाई",
  "rec.kyc4": "आधार से जुड़ा मोबाइल नंबर",
  "rec.kyc4n": "क्लेम का ओटीपी यहीं आता है, ईपीएफ़ओ प्रोफ़ाइल के नंबर पर नहीं।",
  "rec.kyc5": "नामिनी दर्ज",
  "rec.kyc5n": "इसके बिना परिवार को क्लेम फ़ॉर्म की जगह अदालत का प्रमाण-पत्र लाना पड़ेगा।",
  "rec.pensionScheme": "पेंशन योजना",
  "rec.transferredIn": "ट्रांसफ़र हुआ",
  "rec.notDeposited": "महीने जमा नहीं हुए",
  "rec.otherUan": "आपके नाम एक और पीएफ़ नंबर है",
  "rec.otherUanBody": "उसकी नौकरी ऊपर नहीं गिनी गई है, इसलिए आपकी नौकरी असल से कम दिखती है।",

  "pb.sub": "आपने जितने महीने काम किया, और सच में क्या जमा हुआ। आप तनख़्वाह का 12% देते हैं; नियोक्ता 12% देता है, जिसमें से 8.33% ₹15,000 की सीमा तक पेंशन फ़ंड में जाता है।",
  "pb.missingBanner": "आपकी तनख़्वाह से काटा गया और ईपीएफ़ओ तक पहुँचा ही नहीं।",
  "pb.missingBanner2": "वे महीने नीचे लाल रंग में हैं। असली पासबुक उन्हें छापती ही नहीं — वह सिर्फ़ आया हुआ पैसा दिखाती है, इसलिए चोरी ऐसी लगती है जैसे उस महीने आपने काम ही न किया हो।",
  "pb.simplified": "सरल किया गया।",
  "pb.simplifiedBody": "ब्याज साल में एक बार, शुरुआती शेष और साल की आधी जमा पर जोड़ा गया है। ईपीएफ़ओ इसे हर महीने के चलते शेष पर गिनता है, इसलिए असली आँकड़े थोड़े अलग होंगे। तनख़्वाह हर नौकरी में एक-सी मानी गई है, सालाना बढ़ोतरी नहीं जोड़ी गई।",

  "trk.title": "मेरे क्लेम",
  "trk.empty": "इस बार कुछ जमा नहीं हुआ है। यह प्रोटोटाइप दो बार के बीच कुछ याद नहीं रखता — असली पोर्टल आपके हर क्लेम की सूची दिखाता, हर एक किस चरण तक पहुँचा और क्यों फ़ेल हुआ।",
  "trk.checkClaim": "क्लेम जाँचें",
  "trk.withEpfo": "आपका क्लेम ईपीएफ़ओ के पास है",
  "trk.settled": "सेटल हो गया",
  "trk.settledOn": "सेटल हुआ दिन",
  "trk.pastDeadline": "दिन ईपीएफ़ओ की अपनी समय-सीमा के बाद",
  "trk.dayOf": "दिन",
  "trk.of": "में से",
  "trk.settledBody": "पैसा आपके बैंक खाते में पहुँच गया है।",
  "trk.breachedBody": "ईपीएफ़ओ का सिटिज़न्स चार्टर पूरे क्लेम को बीस कार्य दिवसों में निपटाने का वादा करता है। वह बीत चुका है। अब आपके पास आगे बढ़ाने का आधार है, और चिट्ठी नीचे तैयार है।",
  "trk.onTrackBody": "बाक़ी हैं, उसके बाद आप इस आधार पर आगे बढ़ा सकते हैं।",
  "trk.onTrackLead": "ईपीएफ़ओ का अपना वादा है — पूरे क्लेम के लिए बीस कार्य दिवस।",
  "trk.hereNow": "अभी यहाँ",
  "trk.heldBy": "किसके पास:",
  "trk.usually": "आम तौर पर",
  "trk.workingDay": "कार्य दिवस",
  "trk.workingDays": "कार्य दिवस",
  "trk.escalationReady": "आपकी शिकायत की चिट्ठी तैयार है",
  "trk.copyLetter": "चिट्ठी कॉपी करें",
  "trk.protoControl": "प्रोटोटाइप नियंत्रण",
  "trk.protoBody": "कहीं कोई क्लेम जमा नहीं हुआ। घड़ी आगे बढ़ाकर देखें कि वही क्लेम बाद में कैसा दिखता है — ईपीएफ़ओ की समय-सीमा बीत जाने के बाद भी।",
  "trk.day": "दिन",

  "sev.BLOCKER": "क्लेम रोक देगा",
  "sev.RISK": "पैसा या समय जाएगा",
  "sev.ADVISORY": "जान लेना ज़रूरी",
  "check.ruleSource": "यह नियम कहाँ से आया",

  "rec.title": "मेरा रिकॉर्ड",
  "rec.sub": "क्लेम तभी आगे बढ़ता है जब ईपीएफ़ओ, आधार और आपका बैंक ठीक एक जैसा कहें। नीचे हर एक का रिकॉर्ड है।",
  "rec.field": "जानकारी",
  "rec.agrees": "मिलता है",
  "rec.yes": "हाँ",
  "rec.no": "नहीं",
  "rec.name": "नाम",
  "rec.dob": "जन्मतिथि",
  "rec.relation": "पिता या पति का नाम",
  "rec.gender": "लिंग",
  "rec.verification": "वेरिफ़िकेशन की स्थिति",
  "rec.service": "ईपीएफ़ओ में दर्ज नौकरी",
  "rec.noExit": "छोड़ने की तारीख़ दर्ज नहीं",
  "rec.fixOrder": "क्या ठीक कराना है, क्रम से",
  "rec.fixOrderSub": "सबसे देर लगने वाली पहले — वही आज शुरू करनी हैं।",
  "rec.nowCheck": "अब क्लेम जाँचें",

  "pb.title": "पासबुक",
  "pb.month": "महीना",
  "pb.wage": "तनख़्वाह",
  "pb.yours": "आपका",
  "pb.employer": "नियोक्ता",
  "pb.pension": "पेंशन",
  "pb.depositedYear": "इस साल जमा",
  "pb.interestCredited": "ब्याज जुड़ा",
  "pb.closing": "अंतिम शेष",
  "pb.neverDeposited": "तनख़्वाह से कटा, जमा नहीं हुआ",
  "pb.missing": "कम",

  "nav.signOut": "साइन आउट",

  "dash.lastWorked": "आख़िरी नौकरी",
  "dash.currentlyAt": "अभी कार्यरत",
  "dash.balance": "पीएफ़ में जमा रकम",
  "dash.pensionFund": "पेंशन फ़ंड",
  "dash.interest": "ब्याज मिला",
  "dash.years": "दर्ज साल",
  "dash.missingTitle": "तनख़्वाह से कटा, ईपीएफ़ओ तक पहुँचा नहीं",
  "dash.missingBody": "असली पासबुक इन महीनों को छापती ही नहीं, और जो चीज़ न दिखे उसे कोई पकड़ नहीं सकता।",
  "dash.missingCta": "महीने देखें",
  "dash.months": "महीने",
  "dash.record": "आपका रिकॉर्ड",
  "dash.clean": "आपके रिकॉर्ड में कोई रुकावट नहीं है।",
  "dash.cleanBody": "रिकॉर्ड की सभी जाँच पास हैं।",
  "dash.notClean": "गड़बड़ी आपके रिकॉर्ड में है, किसी एक क्लेम में नहीं। एक बार ठीक कराइए, हर क्लेम का रास्ता साफ़।",
  "dash.blocking": "रोकने वाली",
  "dash.costly": "नुक़सान वाली",
  "dash.toNote": "ध्यान देने लायक",
  "dash.passing": "पास",
  "dash.seeChecks": "जाँच देखें",
  "dash.fixRecords": "रिकॉर्ड ठीक कराएँ",
  "dash.whatDo": "आप क्या करना चाहते हैं?",
  "dash.a1h": "पैसा निकालें",
  "dash.a1b": "अपने शब्दों में बताइए। कुछ भरने से पहले जाँच होगी।",
  "dash.a2h": "पासबुक देखें",
  "dash.a2b": "हर महीना, हर नियोक्ता, और जो छूट रहा है।",
  "dash.a3h": "रिकॉर्ड जाँचें",
  "dash.a3b": "जहाँ ईपीएफ़ओ, आधार और बैंक की बात अलग है।",
  "dash.a4h": "क्लेम ट्रैक करें",
  "dash.a4b": "फ़ाइल किस मेज़ पर है, और बीस दिन की घड़ी।",
  "dash.recent": "पिछले कुछ महीने",
  "dash.nothingReceived": "कुछ नहीं आया",

  "check.waitingOn": "आप किसका इंतज़ार कर रहे हैं",
  "check.waitingNote": "ईपीएफ़ओ पोर्टल यह कुछ नहीं बताता। जिस सदस्य को यह पता ही नहीं कि काम नियोक्ता को करना है, वह उस सिस्टम का इंतज़ार करता रहता है जो ख़ुद किसी और का इंतज़ार कर रहा है।",
  "check.checksRun": "जाँचें हुईं",
  "check.thing": "काम",
  "check.things": "काम",
  "check.fileIt": "यह क्लेम भरें",

  "need.orChoose": "या चुनें",
  "need.beforeStart": "शुरू करने से पहले।",
  "need.beforeStartBody": "गड़बड़ियाँ आपके रिकॉर्ड में हैं जो किसी भी क्लेम को रोक देंगी। नीचे की जाँच उन्हें गिना देगी",
  "need.orFixFirst": "या पहले उन्हें ठीक कराएँ",
};

const DICTS: Partial<Record<Locale, Dict>> = { en, hi };

/** Falls back to English rather than showing a key, then to the key itself. */
export function t(locale: Locale, key: string): string {
  return DICTS[locale]?.[key] ?? en[key] ?? key;
}

/** True when the whole interface is available in this language, not just chrome. */
export function isFullyTranslated(locale: Locale): boolean {
  return locale in DICTS;
}
