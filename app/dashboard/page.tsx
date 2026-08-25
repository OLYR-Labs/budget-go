import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import ThemeToggle from "@/components/home/theme-toggle";
import { LogoutButton } from "@/components/dashboard/logout-button";

function formatRole(role: string) {
  return role
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRoleDescription(role: string) {
  switch (role) {
    case "ADMIN":
      return "Head Office Control";

    case "BRANCH_ADMIN":
      return "Branch Management";

    case "BRANCH_STAFF":
      return "Branch Operations";

    case "DELIVERY_STAFF":
      return "Delivery Operations";

    default:
      return "Customer Account";
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(value);
}

type NavigationItem = {
  label: string;
  href: string;
  icon:
    | "grid"
    | "orders"
    | "inventory"
    | "branches"
    | "users"
    | "delivery"
    | "settings";
  active?: boolean;
};

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name:
    | "grid"
    | "orders"
    | "inventory"
    | "branches"
    | "users"
    | "delivery"
    | "settings"
    | "arrow"
    | "trend"
    | "box"
    | "clock"
    | "check"
    | "menu";
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );

    case "orders":
      return (
        <svg {...common}>
          <path d="M6 3h12v18H6z" />
          <path d="M9 7h6" />
          <path d="M9 11h6" />
          <path d="M9 15h4" />
        </svg>
      );

    case "inventory":
      return (
        <svg {...common}>
          <path d="m12 3 8 4-8 4-8-4 8-4Z" />
          <path d="m4 12 8 4 8-4" />
          <path d="m4 17 8 4 8-4" />
        </svg>
      );

    case "branches":
      return (
        <svg {...common}>
          <path d="M3 21h18" />
          <path d="M5 21V5l7-3 7 3v16" />
          <path d="M9 9h1" />
          <path d="M14 9h1" />
          <path d="M9 13h1" />
          <path d="M14 13h1" />
        </svg>
      );

    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20a6 6 0 0 1 12 0" />
          <path d="M16 5a3 3 0 0 1 0 6" />
          <path d="M18 14a5 5 0 0 1 3 6" />
        </svg>
      );

    case "delivery":
      return (
        <svg {...common}>
          <path d="M3 6h11v11H3z" />
          <path d="M14 10h4l3 3v4h-7z" />
          <circle cx="7" cy="19" r="2" />
          <circle cx="18" cy="19" r="2" />
        </svg>
      );

    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-2.5v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6v-2.5h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L9 6.7l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.1h2.5v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V14h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    case "trend":
      return (
        <svg {...common}>
          <path d="m3 17 6-6 4 4 8-9" />
          <path d="M16 6h5v5" />
        </svg>
      );

    case "box":
      return (
        <svg {...common}>
          <path d="m12 3 8 4v10l-8 4-8-4V7l8-4Z" />
          <path d="m4 7 8 4 8-4" />
          <path d="M12 11v10" />
        </svg>
      );

    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "menu":
      return (
        <svg {...common}>
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      );

    default:
      return null;
  }
}

export default async function DashboardPage() {
  const requestHeaders = await headers();

  let session: Awaited<
    ReturnType<typeof auth.api.getSession>
  > = null;

  try {
    session = await auth.api.getSession({
      headers: requestHeaders,
    });
  } catch (error) {
    console.error("Dashboard session lookup failed:", error);
    redirect("/login");
  }

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,

      branchAdmin: {
        select: {
          branchId: true,

          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },

      branchStaff: {
        select: {
          branchId: true,

          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },

      deliveryStaff: {
        select: {
          branchId: true,
          isActive: true,

          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const allowedRoles = [
    "ADMIN",
    "BRANCH_ADMIN",
    "BRANCH_STAFF",
    "DELIVERY_STAFF",
  ];

  if (!allowedRoles.includes(user.role)) {
    redirect("/");
  }

  const isAdmin = user.role === "ADMIN";
  const isBranchAdmin = user.role === "BRANCH_ADMIN";
  const isBranchStaff = user.role === "BRANCH_STAFF";
  const isDeliveryStaff = user.role === "DELIVERY_STAFF";

  const branch =
    user.branchAdmin?.branch ??
    user.branchStaff?.branch ??
    user.deliveryStaff?.branch ??
    null;

  if (!isAdmin && !branch) {
    redirect("/login");
  }

  const branchId = branch?.id ?? null;

  const orderWhere = isAdmin
    ? {}
    : {
        branchId: branchId!,
      };

  const branchWhere = isAdmin
    ? {}
    : {
        id: branchId!,
      };

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    pendingOrders,
    ordersToday,
    revenueResult,
    totalBranches,
    activeBranches,
    branchStaffCount,
    deliveryStaffCount,
    recentOrders,
    branches,
  ] = await Promise.all([
    prisma.order.count({
      where: orderWhere,
    }),

    prisma.order.count({
      where: {
        ...orderWhere,
        status: "PENDING",
      },
    }),

    prisma.order.count({
      where: {
        ...orderWhere,
        createdAt: {
          gte: today,
        },
      },
    }),

    prisma.order.aggregate({
      where: {
        ...orderWhere,
        paymentStatus: "PAID",
      },

      _sum: {
        total: true,
      },
    }),

    prisma.branch.count({
      where: isAdmin ? {} : branchWhere,
    }),

    prisma.branch.count({
      where: isAdmin
        ? {
            isActive: true,
          }
        : {
            ...branchWhere,
            isActive: true,
          },
    }),

    prisma.branchStaff.count({
      where: isAdmin
        ? {}
        : {
            branchId: branchId!,
          },
    }),

    prisma.deliveryStaff.count({
      where: isAdmin
        ? {
            isActive: true,
          }
        : {
            branchId: branchId!,
            isActive: true,
          },
    }),

    prisma.order.findMany({
      where: orderWhere,

      orderBy: {
        createdAt: "desc",
      },

      take: 6,

      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        total: true,
        customerName: true,
        createdAt: true,

        branch: {
          select: {
            name: true,
            code: true,
          },
        },

        items: {
          select: {
            quantity: true,
          },
        },
      },
    }),

    prisma.branch.findMany({
      where: isAdmin ? {} : branchWhere,

      orderBy: {
        name: "asc",
      },

      take: 8,

      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,

        _count: {
          select: {
            orders: true,
            staff: true,
            deliveryStaff: true,
            inventory: true,
          },
        },
      },
    }),
  ]);

  const revenue = Number(revenueResult._sum.total ?? 0);

  const role = formatRole(user.role);
  const roleDescription = getRoleDescription(user.role);
  const initials = getInitials(user.name);

  const navigation: NavigationItem[] = [
    {
      label: "Overview",
      href: "#overview",
      icon: "grid",
      active: true,
    },

    {
      label: "Orders",
      href: "#orders",
      icon: "orders",
    },

    {
      label: "Inventory",
      href: "#inventory",
      icon: "inventory",
    },
  ];

  if (isAdmin) {
    navigation.push({
      label: "Branches",
      href: "#branches",
      icon: "branches",
    });

    navigation.push({
      label: "Staff",
      href: "#staff",
      icon: "users",
    });
  }

  if (isBranchAdmin || isBranchStaff) {
    navigation.push({
      label: "Delivery",
      href: "#delivery",
      icon: "delivery",
    });
  }

  if (isDeliveryStaff) {
    navigation.length = 0;

    navigation.push({
      label: "Overview",
      href: "#overview",
      icon: "grid",
      active: true,
    });

    navigation.push({
      label: "My Deliveries",
      href: "#orders",
      icon: "delivery",
    });
  }

  return (
    <main
      className="
        min-h-screen
        bg-zinc-50
        text-zinc-950
        transition-colors
        duration-300
        selection:bg-purple-500/30

        dark:bg-[#08080b]
        dark:text-white
      "
    >
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div
          className="
            absolute
            left-[-18rem]
            top-[-18rem]
            h-[38rem]
            w-[38rem]
            rounded-full
            bg-purple-700/10
            blur-[120px]
          "
        />

        <div
          className="
            absolute
            right-[-15rem]
            top-[20%]
            h-[32rem]
            w-[32rem]
            rounded-full
            bg-violet-700/[0.07]
            blur-[120px]
          "
        />

        <div
          className="
            absolute
            bottom-[-20rem]
            left-[35%]
            h-[36rem]
            w-[36rem]
            rounded-full
            bg-purple-900/[0.08]
            blur-[130px]
          "
        />
      </div>

      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside
          className="
            hidden
            w-64
            shrink-0
            border-r
            border-zinc-200
            bg-white/90
            px-4
            py-5
            backdrop-blur-2xl

            dark:border-white/[0.07]
            dark:bg-[#0b0b0f]/90

            lg:flex
            lg:flex-col
          "
        >
          {/* Brand */}
          <div className="flex items-center gap-3 px-3">
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-purple-600
                shadow-lg
                shadow-purple-600/25
              "
            >
              <span className="text-lg font-black text-white">B</span>
            </div>

            <div>
              <p className="text-sm font-black tracking-tight">
                Budget Go
              </p>

              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                Operations
              </p>
            </div>
          </div>

          {/* Workspace */}
          <div
            className="
              mt-8
              rounded-2xl
              border
              border-zinc-200
              bg-zinc-50
              p-3

              dark:border-white/[0.07]
              dark:bg-white/[0.025]
            "
          >
            <p className="px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-600">
              Workspace
            </p>

            <div
              className="
                mt-3
                flex
                items-center
                gap-3
                rounded-xl
                bg-purple-500/[0.08]
                px-3
                py-3
              "
            >
              <div
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  bg-purple-500/15
                  text-purple-500

                  dark:text-purple-300
                "
              >
                <Icon name="branches" className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-bold">
                  {isAdmin ? "Head Office" : branch?.name}
                </p>

                <p className="truncate text-[10px] text-zinc-500">
                  {isAdmin
                    ? "Global network"
                    : `Branch ${branch?.code}`}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-7 flex-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-600">
              Navigation
            </p>

            <div className="mt-3 space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`
                    group
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-2.5
                    text-sm
                    font-medium
                    transition-all
                    duration-200

                    ${
                      item.active
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-600/15"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-white"
                    }
                  `}
                >
                  <Icon
                    name={item.icon}
                    className="h-[18px] w-[18px]"
                  />

                  <span>{item.label}</span>

                  {item.active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </a>
              ))}
            </div>
          </nav>

          {/* Bottom controls */}
          <div className="border-t border-zinc-200 pt-4 dark:border-white/[0.07]">
            <a
              href="#settings"
              className="
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-2.5
                text-sm
                font-medium
                text-zinc-600
                transition
                hover:bg-zinc-100
                hover:text-zinc-950

                dark:text-zinc-400
                dark:hover:bg-white/[0.04]
                dark:hover:text-white
              "
            >
              <Icon
                name="settings"
                className="h-[18px] w-[18px]"
              />

              Settings
            </a>

            {/* Theme switcher */}
            <div
              className="
                mt-2
                flex
                items-center
                justify-between
                rounded-xl
                px-3
                py-2.5
                text-sm
                font-medium
                text-zinc-600

                dark:text-zinc-400
              "
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium">
                  Theme
                </span>
              </div>

              <ThemeToggle />
            </div>

            {/* Logout */}
            <div className="mt-2">
              <LogoutButton />
            </div>

            {/* User */}
            <div
              className="
                mt-4
                flex
                items-center
                gap-3
                rounded-xl
                border
                border-zinc-200
                bg-zinc-50
                p-3

                dark:border-transparent
                dark:bg-white/[0.025]
              "
            >
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-gradient-to-br
                  from-purple-500
                  to-violet-700
                  text-xs
                  font-black
                  text-white
                "
              >
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-bold">
                  {user.name}
                </p>

                <p className="truncate text-[10px] text-zinc-500">
                  {role}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          {/* Topbar */}
          <header
            className="
              sticky
              top-0
              z-30
              border-b
              border-zinc-200
              bg-white/80
              backdrop-blur-2xl

              dark:border-white/[0.07]
              dark:bg-[#08080b]/80
            "
          >
            <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 sm:px-7 lg:px-10">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 font-black text-white">
                  B
                </div>

                <span className="text-sm font-black">
                  Budget Go
                </span>
              </div>

              <div className="hidden lg:block">
                <p className="text-xs text-zinc-500">
                  {isAdmin ? "Head Office" : branch?.name}
                </p>

                <p className="text-sm font-semibold">
                  {roleDescription}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className="
                    hidden
                    rounded-full
                    border
                    border-emerald-500/20
                    bg-emerald-500/[0.07]
                    px-3
                    py-1.5
                    text-[11px]
                    font-semibold
                    text-emerald-500

                    dark:text-emerald-400

                    sm:block
                  "
                >
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />

                  Systems operational
                </div>

                {/* Theme switcher */}
                <div
                  className="
                    rounded-xl
                    border
                    border-zinc-200
                    bg-zinc-100

                    dark:border-white/[0.08]
                    dark:bg-white/[0.03]
                  "
                >
                  <ThemeToggle />
                </div>

                <div
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-zinc-200
                    bg-zinc-100

                    dark:border-white/[0.08]
                    dark:bg-white/[0.03]
                  "
                >
                  <Icon name="menu" className="h-4 w-4" />
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
            {/* Page heading */}
            <section
              id="overview"
              className="scroll-mt-24"
            >
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                  <div
                    className="
                      mb-4
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      border
                      border-purple-500/15
                      bg-purple-500/[0.07]
                      px-3
                      py-1.5
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.16em]
                      text-purple-600

                      dark:text-purple-300
                    "
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />

                    {isAdmin
                      ? "Head Office Dashboard"
                      : `${branch?.name} Dashboard`}
                  </div>

                  <h1
                    className="
                      text-3xl
                      font-black
                      tracking-[-0.04em]
                      text-zinc-950

                      dark:text-white

                      sm:text-4xl
                      lg:text-5xl
                    "
                  >
                    Good to see you{" "}
                    <span className="text-purple-600 dark:text-purple-400">
                      {user.name.split(" ")[0]}.
                    </span>
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                    {isAdmin
                      ? "Monitor your entire Budget Go network from one central operations workspace."
                      : `Monitor ${branch?.name} branch operations, orders, inventory and staff from one workspace.`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="
                      rounded-xl
                      border
                      border-zinc-200
                      bg-white
                      px-4
                      py-2.5

                      dark:border-white/[0.08]
                      dark:bg-white/[0.025]
                    "
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Access
                    </p>

                    <p className="mt-0.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {role}
                    </p>
                  </div>

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-xl
                      bg-gradient-to-br
                      from-purple-500
                      to-violet-700
                      text-xs
                      font-black
                      text-white
                      shadow-lg
                      shadow-purple-700/20
                    "
                  >
                    {initials}
                  </div>
                </div>
              </div>
            </section>

            {/* KPI Cards */}
            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {/* Revenue */}
              <div
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-2xl
                  border
                  border-zinc-200
                  bg-white
                  p-5
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:border-purple-500/20
                  hover:shadow-xl
                  hover:shadow-purple-950/20

                  dark:border-white/[0.07]
                  dark:bg-[#101014]
                "
              >
                <div className="absolute right-[-2rem] top-[-2rem] h-24 w-24 rounded-full bg-purple-600/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500">
                      Revenue
                    </span>

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Icon name="trend" className="h-4 w-4" />
                    </div>
                  </div>

                  <p className="mt-5 text-2xl font-black tracking-tight">
                    {formatCurrency(revenue)}
                  </p>

                  <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-600">
                    Paid orders
                  </p>
                </div>
              </div>

              {/* Total orders */}
              <div
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-2xl
                  border
                  border-zinc-200
                  bg-white
                  p-5
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:border-purple-500/20
                  hover:shadow-xl

                  dark:border-white/[0.07]
                  dark:bg-[#101014]
                "
              >
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500">
                      Total orders
                    </span>

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-white/[0.05] dark:text-zinc-300">
                      <Icon name="orders" className="h-4 w-4" />
                    </div>
                  </div>

                  <p className="mt-5 text-2xl font-black tracking-tight">
                    {totalOrders}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-[11px]">
                    <span className="text-purple-600 dark:text-purple-400">
                      {ordersToday}
                    </span>

                    <span className="text-zinc-500 dark:text-zinc-600">
                      today
                    </span>
                  </div>
                </div>
              </div>

              {/* Pending orders */}
              <div
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-2xl
                  border
                  border-zinc-200
                  bg-white
                  p-5
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:border-amber-500/20
                  hover:shadow-xl

                  dark:border-white/[0.07]
                  dark:bg-[#101014]
                "
              >
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500">
                      Pending orders
                    </span>

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Icon name="clock" className="h-4 w-4" />
                    </div>
                  </div>

                  <p className="mt-5 text-2xl font-black tracking-tight">
                    {pendingOrders}
                  </p>

                  <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-600">
                    Awaiting action
                  </p>
                </div>
              </div>

              {/* Active staff */}
              <div
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-2xl
                  border
                  border-zinc-200
                  bg-white
                  p-5
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:border-purple-500/20
                  hover:shadow-xl

                  dark:border-white/[0.07]
                  dark:bg-[#101014]
                "
              >
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500">
                      Active staff
                    </span>

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Icon name="users" className="h-4 w-4" />
                    </div>
                  </div>

                  <p className="mt-5 text-2xl font-black tracking-tight">
                    {branchStaffCount + deliveryStaffCount}
                  </p>

                  <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-600">
                    {branchStaffCount} staff · {deliveryStaffCount} delivery
                  </p>
                </div>
              </div>
            </section>

            {/* Main dashboard grid */}
            <section className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
              {/* Recent orders */}
              <div
                id="orders"
                className="
                  scroll-mt-24
                  overflow-hidden
                  rounded-2xl
                  border
                  border-zinc-200
                  bg-white

                  dark:border-white/[0.07]
                  dark:bg-[#101014]
                "
              >
                <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-5 dark:border-white/[0.06]">
                  <div>
                    <p className="text-sm font-bold">
                      Recent orders
                    </p>

                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-600">
                      Latest activity across your workspace
                    </p>
                  </div>

                  <a
                    href="#orders"
                    className="group flex items-center gap-1 text-xs font-semibold text-purple-600 transition hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    View all

                    <Icon
                      name="arrow"
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                    />
                  </a>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-white/[0.05]">
                  {recentOrders.length === 0 ? (
                    <div className="px-5 py-14 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-white/[0.04]">
                        <Icon name="box" />
                      </div>

                      <p className="mt-4 text-sm font-semibold">
                        No orders yet
                      </p>

                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-600">
                        New orders will appear here.
                      </p>
                    </div>
                  ) : (
                    recentOrders.map((order) => {
                      const itemCount = order.items.reduce(
                        (sum, item) => sum + item.quantity,
                        0,
                      );

                      return (
                        <div
                          key={order.id}
                          className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.025]"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                              <Icon
                                name="orders"
                                className="h-4 w-4"
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold">
                                {order.orderNumber}
                              </p>

                              <p className="mt-1 truncate text-[11px] text-zinc-500 dark:text-zinc-600">
                                {order.customerName} · {itemCount} item
                                {itemCount === 1 ? "" : "s"}
                              </p>
                            </div>
                          </div>

                          <div className="hidden text-right sm:block">
                            <p className="text-xs font-bold">
                              {formatCurrency(Number(order.total))}
                            </p>

                            <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-600">
                              {order.branch.name}
                            </p>
                          </div>

                          <span
                            className={`
                              shrink-0
                              rounded-full
                              px-2.5
                              py-1
                              text-[9px]
                              font-bold
                              uppercase
                              tracking-wider

                              ${
                                order.status === "PENDING"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : order.status === "DELIVERED"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                              }
                            `}
                          >
                            {order.status.replaceAll("_", " ")}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Network / branch overview */}
              <div
                id="branches"
                className="
                  scroll-mt-24
                  overflow-hidden
                  rounded-2xl
                  border
                  border-zinc-200
                  bg-white

                  dark:border-white/[0.07]
                  dark:bg-[#101014]
                "
              >
                <div className="border-b border-zinc-200 px-5 py-5 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">
                        {isAdmin
                          ? "Branch network"
                          : "Branch overview"}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-600">
                        {isAdmin
                          ? `${totalBranches} locations`
                          : branch?.name}
                      </p>
                    </div>

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Icon name="branches" className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-white/[0.05]">
                  {branches.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.025]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-[10px] font-black text-zinc-500 dark:bg-white/[0.04] dark:text-zinc-400">
                          {item.code}
                        </div>

                        <div>
                          <p className="text-xs font-bold">
                            {item.name}
                          </p>

                          <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-600">
                            {item._count.orders} orders ·{" "}
                            {item._count.inventory} products
                          </p>
                        </div>
                      </div>

                      <span
                        className={`
                          h-2
                          w-2
                          rounded-full
                          ${
                            item.isActive
                              ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]"
                              : "bg-zinc-400 dark:bg-zinc-600"
                          }
                        `}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Operational modules */}
            <section className="mt-6 grid gap-4 md:grid-cols-3">
              <a
                id="inventory"
                href="#inventory"
                className="
                  group
                  scroll-mt-24
                  rounded-2xl
                  border
                  border-zinc-200
                  bg-white
                  p-5
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:border-purple-500/20

                  dark:border-white/[0.07]
                  dark:bg-[#101014]
                "
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Icon name="inventory" />
                  </div>

                  <Icon
                    name="arrow"
                    className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-1 group-hover:text-purple-500 dark:text-zinc-700 dark:group-hover:text-purple-400"
                  />
                </div>

                <p className="mt-5 text-sm font-bold">
                  Inventory
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-600">
                  Monitor branch stock, product availability and pricing.
                </p>
              </a>

              <a
                id="delivery"
                href="#delivery"
                className="
                  group
                  scroll-mt-24
                  rounded-2xl
                  border
                  border-zinc-200
                  bg-white
                  p-5
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:border-purple-500/20

                  dark:border-white/[0.07]
                  dark:bg-[#101014]
                "
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Icon name="delivery" />
                  </div>

                  <Icon
                    name="arrow"
                    className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-1 group-hover:text-purple-500 dark:text-zinc-700 dark:group-hover:text-purple-400"
                  />
                </div>

                <p className="mt-5 text-sm font-bold">
                  Delivery
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-600">
                  Track delivery operations and assigned delivery staff.
                </p>
              </a>

              <a
                id="staff"
                href="#staff"
                className="
                  group
                  scroll-mt-24
                  rounded-2xl
                  border
                  border-zinc-200
                  bg-white
                  p-5
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:border-purple-500/20

                  dark:border-white/[0.07]
                  dark:bg-[#101014]
                "
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Icon name="users" />
                  </div>

                  <Icon
                    name="arrow"
                    className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-1 group-hover:text-purple-500 dark:text-zinc-700 dark:group-hover:text-purple-400"
                  />
                </div>

                <p className="mt-5 text-sm font-bold">
                  Staff management
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-600">
                  Manage branch staff, delivery staff and access.
                </p>
              </a>
            </section>

            {/* Access model */}
            <section
              className="
                mt-6
                overflow-hidden
                rounded-2xl
                border
                border-purple-500/10
                bg-gradient-to-br
                from-purple-50
                via-white
                to-white
                p-6

                dark:from-purple-950/20
                dark:via-[#101014]
                dark:to-[#101014]

                sm:p-8
              "
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-purple-600 dark:text-purple-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />

                    Access scope
                  </div>

                  <h2 className="mt-3 text-xl font-black">
                    {isAdmin
                      ? "Head Office has global visibility."
                      : `${branch?.name} is your assigned workspace.`}
                  </h2>

                  <p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-500">
                    {isAdmin
                      ? "You can monitor branches, orders, inventory, staff and delivery operations across the entire Budget Go network."
                      : "Your workspace is isolated to your assigned branch. Branch-level data remains separated from the rest of the network."}
                  </p>
                </div>

                <div
                  className="
                    shrink-0
                    rounded-xl
                    border
                    border-zinc-200
                    bg-zinc-50
                    px-4
                    py-3

                    dark:border-white/[0.08]
                    dark:bg-black/20
                  "
                >
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-600">
                    Scope
                  </p>

                  <p className="mt-1 text-xs font-bold text-purple-600 dark:text-purple-300">
                    {isAdmin
                      ? "GLOBAL"
                      : `BRANCH · ${branch?.code}`}
                  </p>
                </div>
              </div>
            </section>

            <footer className="py-8 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-700">
              Budget Go Operations · Secure workspace
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}