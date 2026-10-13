const User = require("../models/User");

const seedPrincipal = async () => {
  try {
    const email = process.env.PRINCIPAL_EMAIL;
    const password = process.env.PRINCIPAL_PASSWORD;

    if (!email || !password) {
      console.warn("PRINCIPAL_EMAIL or PRINCIPAL_PASSWORD not set in environment.");
      return;
    }

    const principalExists = await User.findOne({ email });
    const anyPrincipalExists = await User.findOne({ role: "principal" });

    if (!principalExists && !anyPrincipalExists) {
      const principal = await User.create({
        name: "School Principal",
        email: email,
        password: password,
        role: "principal",
        status: "active",
      });
      console.log(`Principal user created: ${principal.email}`);
    } else {
      console.log("Principal account already exists.");
    }
  } catch (error) {
    console.error("Error seeding principal:", error.message);
  }
};

const seedSuperAdmin = async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      console.warn("SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in environment.");
      return;
    }

    const superAdminExists = await User.findOne({ email });
    const anySuperAdminExists = await User.findOne({ role: "superadmin" });

    if (!superAdminExists && !anySuperAdminExists) {
      const superAdmin = await User.create({
        name: "Super Admin",
        email: email,
        password: password,
        role: "superadmin",
        status: "active",
      });
      console.log(`Super Admin user created: ${superAdmin.email}`);
    } else {
      console.log("Super Admin account already exists.");
    }
  } catch (error) {
    console.error("Error seeding Super Admin:", error.message);
  }
};

module.exports = { seedPrincipal, seedSuperAdmin };
