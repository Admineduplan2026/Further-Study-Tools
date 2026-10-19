/* Eduplan Lab settings.
   EDUPLAN_WHATSAPP: the counsellors' WhatsApp number, e.g. "+60 12-345 6789". Empty shows "will be added soon".
   EDUPLAN_OFFERS: real, confirmed offers only (early-bird discounts, application fee waivers ...). Each one:
     {tag:"Early bird", title:"RM 1,000 off the first semester", institution:"XMUM", deadline:"2027-01-31", url:"https://..."}
   With a deadline, the card shows a "N days left" countdown. Leave the list empty until a university confirms an offer.
   EDUPLAN_MEMBERS_ONLY: true shows Register / Sign in / Visitor on the home page and keeps the scholarship, interest and
   guidance searches for members. false (for now, until Eduplan turns it on) leaves every search open to everyone. */
window.EDUPLAN_WHATSAPP="";
window.EDUPLAN_OFFERS=[];
window.EDUPLAN_MEMBERS_ONLY=false;
