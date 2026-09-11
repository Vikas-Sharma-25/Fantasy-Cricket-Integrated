import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { User, UserRole } from "../models/User";

const VALID_ROLES: UserRole[] = ["user", "admin", "super_admin"];

async function main() {
  const args = process.argv.slice(2);
  const email = args[0]?.trim()?.toLowerCase();
  const role = args[1]?.trim()?.toLowerCase() as UserRole;

  if (!email || !role) {
    console.error("❌ Usage: npm run set:role -- <email> <user|admin|super_admin>");
    process.exit(1);
  }

  if (!VALID_ROLES.includes(role)) {
    console.error(`❌ Invalid role "${role}". Allowed roles: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }

  try {
    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`❌ No user found with email: ${email}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    console.log(`✅ Successfully updated role for ${user.email} (${user.name}):`);
    console.log(`   Previous Role: ${previousRole}`);
    console.log(`   New Role:      ${user.role}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting user role:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();

