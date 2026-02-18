import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const folder = formData.get("bucket") as string || "avatars";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const dataUri = `data:${file.type};base64,${base64}`;

        // Generate signature
        const timestamp = Math.round(Date.now() / 1000);
        const crypto = await import("crypto");
        const signatureStr = `folder=star-tracker/${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

        // Upload to Cloudinary
        const uploadFormData = new FormData();
        uploadFormData.append("file", dataUri);
        uploadFormData.append("api_key", apiKey);
        uploadFormData.append("timestamp", timestamp.toString());
        uploadFormData.append("signature", signature);
        uploadFormData.append("folder", `star-tracker/${folder}`);

        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: "POST", body: uploadFormData },
        );

        const data = await res.json();

        if (data.secure_url) {
            return NextResponse.json({ url: data.secure_url });
        }

        return NextResponse.json({ error: data.error?.message || "Upload failed" }, { status: 500 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
    }
}
