import { Schema, model, models } from 'mongoose';

const SectionSchema = new Schema({
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    isActive: { type: Boolean, default: true }
}, { _id: false });

const FaqItemSchema = new Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { _id: false });

const LandingPageContentSchema = new Schema(
    {
        hero: {
            title: { type: String, default: "DOMINATE THE BATTLEGROUND" },
            subtitle: { type: String, default: "Join the elite arena where skill pays off. Compete in daily High-Stakes Tournaments, climbing the ranks to become a legend." },
            badgeText: { type: String, default: "#1 Esports Platform" },
            primaryCtaText: { type: String, default: "Get Started" },
            secondaryCtaText: { type: String, default: "Sign In" },
        },
        about: {
            title: { type: String, default: "About Guru Zone" },
            content: { type: String, default: "The ultimate platform for esports enthusiasts. We turn your gaming passion into a professional career." },
            mission: { type: String, default: "" },
            vision: { type: String, default: "" },
        },
        privacyPolicy: {
            title: { type: String, default: "Privacy Policy" },
            content: { type: String, default: "" },
        },
        termsOfService: {
            title: { type: String, default: "Terms of Service" },
            content: { type: String, default: "" },
        },
        refundPolicy: {
            title: { type: String, default: "Refund Policy" },
            content: { type: String, default: "" },
        },
        faqs: [FaqItemSchema],
        socialLinks: {
            twitter: { type: String, default: "#" },
            instagram: { type: String, default: "#" },
            youtube: { type: String, default: "#" },
            whatsapp: { type: String, default: "" },
        },
        contactInfo: {
            email: { type: String, default: "support@guruzone.com" },
            phone: { type: String, default: "" },
            address: { type: String, default: "" },
        }
    },
    { timestamps: true }
);

if (process.env.NODE_ENV === 'development' && models.LandingPageContent) {
    delete models.LandingPageContent;
}

const LandingPageContent = models.LandingPageContent || model('LandingPageContent', LandingPageContentSchema);

export default LandingPageContent;
