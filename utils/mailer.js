import nodemailer from "nodemailer";

const testAccount = await nodemailer.createTestAccount();

const transporter = nodemailer.createTransport({
    service: "smtp.ethereal.email",
    port: 587,
    auth: {
        user: testAccount.user,
        pass: testAccount.pass
    }
});

const email = async ({ to, subject, text, html }) => {
    try {
        await transporter.sendMail({
            from: `BANK <${testAccount.user}>`,
            to,
            subject,
            text,
            html,
        });
    } catch (error) {
        // TODO: handle correctly (add error to DB and resolve in admin panel)
        console.error("Email service failed: ", error.message);
    }
};

export default email;
