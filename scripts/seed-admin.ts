import { auth } from "@/lib/auth";

async function seedAdmin() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    console.error(
      "❌ ADMIN_NAME, ADMIN_EMAIL, or ADMIN_PASSWORD missing in env.",
    );
    process.exit(1);
  }

  console.log(`🌱 Seeding admin user: ${email}`);

  try {
    // Check if user exists
    // better-auth doesn't expose findUserByEmail in root object directly in v1?
    // Usually auth.api.signUpEmail handles duplicate checks.

    // We'll mimic a request context? No, better-auth provides direct API if we import it on server?
    // Wait, auth.api.signUpEmail requires Request context usually?
    // Actually, let's try direct DB check or catch error.

    // Using internal API to create user:
    // better-auth exposes 'api' on the server instance.
    // However, server actions usually require headers().
    // We can mock headers or use internal methods if available.

    // Let's try attempting sign up via API.
    // If we run this script via bun, we are in a server context but maybe not a request context.
    // better-auth might complain.

    // Alternative: Direct SQL if hashing is standard. better-auth typically uses standard hashing.
    // But hashing implementation details vary.

    // Let's use auth.api.signUpEmail if possible.
    // It takes 'body' and optional context.

    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (result?.user) {
      console.log("✅ Admin user created successfully.");
      console.log(`User ID: ${result.user.id}`);
    } else {
      // If result is null/undefined, check if user exists or other error?
      // better-auth throws error or returns error object?
      console.log(
        "⚠️ User creation returned no result. User might already exist.",
      );
    }
  } catch (error: any) {
    // If user exists, better-auth usually throws APIError or returns error
    if (
      error.message?.includes("already exists") ||
      error.body?.message?.includes("User already exists")
    ) {
      console.log("ℹ️ Admin user already exists. Skipping.");
    } else {
      console.error("❌ Error seeding admin:", error);
    }
  }
}

seedAdmin();
