import type { ReactNode } from "react";
import { A, Code, H2, H3, P, Steps, Table, Tip, UL, Warn } from "@/components/docs/ui";
import { COMPANY } from "@/lib/company";
import { EXPORT_PLANS, PLAN_COMMON } from "@/lib/billing/plans";
import { resources } from "@/lib/export";

export type DocPage = { slug: string; group: "Start here" | "Klyroo Export"; title: string; summary: string; body: () => ReactNode };

const mail = <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>;
const n = (x: number) => x.toLocaleString("en-GB");

export const DOCS: DocPage[] = [
  // ───────────────────────── Start here ─────────────────────────
  {
    slug: "account",
    group: "Start here",
    title: "Your Klyroo account",
    summary: "Create an account, and manage your password, billing and data.",
    body: () => (
      <>
        <P>Your Klyroo account gives you access to Klyroo Export, with its own plan and billing.</P>
        <H2>Create your account</H2>
        <Steps items={[
          { title: "Open the sign-up page", body: <P>Go to <A href="/login">useklyroo.com/login</A> and stay on the <strong className="font-normal">Create account</strong> tab.</P> },
          { title: "Enter your details", body: <P>Your name, an optional company name (shown as your account name), your email and a password of at least 10 characters.</P> },
          { title: "Confirm your email", body: <P>We email you a confirmation link. If it doesn&apos;t arrive, check spam and use <strong className="font-normal">resend the confirmation email</strong> on the sign-up screen.</P> },
          { title: "Connect your store", body: <P>After you log in you land in Klyroo Export. Start by <A href="/docs/export/connect-shopify">connecting your Shopify store</A>.</P> },
        ]} />
        <H2>Billing</H2>
        <P>The <strong className="font-normal">Billing</strong> page is in the sidebar. Plans are monthly and you can cancel from that page at any time. Payments are handled by Dodo Payments, our Merchant of Record. See the <A href="/refunds">refund policy</A> for the 30-day money-back guarantee.</P>
        <H2>Forgot your password?</H2>
        <Steps items={[
          { title: "Ask for a link", body: <P>On the <A href="/login">log in</A> screen choose <strong className="font-normal">Forgot your password?</strong> and enter your email.</P> },
          { title: "Open the email", body: <P>We email a link that works once. Check spam if you don&apos;t see it within a minute.</P> },
          { title: "Choose a new password", body: <P>Use at least 10 characters. You&apos;re signed in straight away.</P> },
        ]} />
        <P>To change your password while signed in, open <strong className="font-normal">Account</strong> and use <strong className="font-normal">Password</strong>.</P>
        <H2>Deleting your account</H2>
        <P>Open <strong className="font-normal">Account</strong>, scroll to <strong className="font-normal">Delete account</strong>, type your email and password. This cancels any paid plan first, then permanently removes your stores, export history and files. It can&apos;t be undone, and only the account owner can do it.</P>
        <H2>Need something else?</H2>
        <P>To change your email address, or if anything here doesn&apos;t work, email {mail}.</P>
      </>
    ),
  },

  // ───────────────────────── Export ─────────────────────────
  {
    slug: "export/getting-started",
    group: "Klyroo Export",
    title: "Get started with Klyroo Export",
    summary: "Connect your store and download your first export in about five minutes.",
    body: () => (
      <>
        <P>Klyroo Export turns your Shopify data into spreadsheet files. It only <em>reads</em> your store. It never changes anything.</P>
        <H2>Before you start</H2>
        <UL>
          <li>A Klyroo account with <strong className="font-normal">Export</strong> switched on (see <A href="/docs/account">Your Klyroo account</A>).</li>
          <li>Access to the Shopify account that <strong className="font-normal">owns</strong> your store.</li>
        </UL>
        <H2>Your first export</H2>
        <Steps items={[
          { title: "Connect your store", body: <P>Create a small read-only app in Shopify and paste its credentials into Klyroo. Follow the <A href="/docs/export/connect-shopify">connection guide</A>. It takes about two minutes.</P> },
          { title: "Pick a template", body: <P>Go to <strong className="font-normal">Home</strong> and choose a template, such as <em>Full product catalog</em> or <em>Orders for 3PL</em>. The builder opens with the right columns already chosen.</P> },
          { title: "Check the preview", body: <P>The panel on the right shows the first rows from your real store. If something looks wrong, change the filters or columns and the preview updates.</P> },
          { title: "Run the export", body: <P>Press <strong className="font-normal">Run export</strong>. You&apos;ll see progress. Large exports can take a few minutes, and you can leave the page. Your file waits in <strong className="font-normal">History</strong>.</P> },
          { title: "Download", body: <P>When it says <em>Ready</em>, press <strong className="font-normal">Download</strong>. Open the file in Excel, Numbers or Google Sheets.</P> },
        ]} />
        <Tip>New to the builder? Read <A href="/docs/export/building-exports">Building an export</A> to learn about filters, columns and metafields.</Tip>
      </>
    ),
  },
  {
    slug: "export/connect-shopify",
    group: "Klyroo Export",
    title: "Connect your Shopify store",
    summary: "Create a read-only app in Shopify and connect it to Klyroo.",
    body: () => (
      <>
        <P>Klyroo reads your store through credentials that <em>you</em> create in your own Shopify account. You stay in control and can revoke them at any time. Shopify&apos;s screens change from time to time, so button names may differ slightly.</P>
        <Warn>The app must be created by the account that <strong className="font-normal">owns the store</strong>. Shopify only issues access when the app and the store belong to the same organization.</Warn>
        <H2>1. Create the app in Shopify</H2>
        <Steps items={[
          { title: "Open the Dev Dashboard", body: <P>Sign in at <Code>dev.shopify.com</Code> with the account that owns your store.</P> },
          { title: "Create an app", body: <P>Choose <strong className="font-normal">Apps → Create app</strong>, name it <Code>Klyroo Export</Code>, and create it.</P> },
          { title: "Add read-only permissions", body: (
            <>
              <P>Open <strong className="font-normal">Versions</strong>, create a version, and add these access scopes:</P>
              <Table head={["Scope", "What it lets you export"]} rows={[
                [<Code key="a">read_products</Code>, "Products, variants and collections"],
                [<Code key="b">read_inventory</Code>, "Inventory levels"],
                [<Code key="c">read_locations</Code>, "Location names (needed for inventory exports)"],
                [<Code key="d">read_orders</Code>, "Orders from the last 60 days"],
                [<Code key="e">read_customers</Code>, "Customers"],
                [<><Code key="f">read_all_orders</Code> (optional)</>, "Orders older than 60 days"],
              ]} />
              <P>Add only what you plan to export. Then <strong className="font-normal">Release</strong> the version.</P>
            </>
          ) },
          { title: "Install the app on your store", body: <P>On the app&apos;s <strong className="font-normal">Home</strong> tab, install it on your store and approve the permissions.</P> },
          { title: "Copy your credentials", body: <P>Open <strong className="font-normal">Settings → Credentials</strong>. Copy the <strong className="font-normal">Client ID</strong> and the <strong className="font-normal">Client secret</strong>. Treat the secret like a password.</P> },
        ]} />
        <H2>2. Connect it in Klyroo</H2>
        <Steps items={[
          { title: "Open Stores", body: <P>In Klyroo Export, open <strong className="font-normal">Stores</strong> in the sidebar.</P> },
          { title: "Enter the details", body: <P>Your store address (it ends in <Code>.myshopify.com</Code>, not your custom domain), the Client ID, and the Client secret.</P> },
          { title: "Test and connect", body: <P>Press <strong className="font-normal">Test and connect</strong>. We check the credentials with Shopify and show which permissions were granted. Your secret is encrypted before it is saved.</P> },
        ]} />
        <H2>If something goes wrong</H2>
        <Table head={["You see", "What it means and what to do"]} rows={[
          ["Shopify rejected these credentials", "The Client ID or secret is wrong. Copy them again from Settings → Credentials, with no extra spaces."],
          ["The app isn't installed on this store yet", "Install the app from its Home tab in the Dev Dashboard, then try again."],
          ["We couldn't find that store", "Check the address. It must end in .myshopify.com."],
          ["Shopify won't issue a token for this app and store", "The app and the store are in different organizations. Create the app from the account that owns the store."],
          ["The app is installed but has no permissions", "Add the read scopes, release a new version, and approve it on the store."],
          ["Too many attempts", "We limit connection tests to 10 every 10 minutes. Wait a few minutes."],
        ]} />
        <H2>Reconnect, disconnect and revoke</H2>
        <UL>
          <li><strong className="font-normal">Test connection</strong> on a store card re-checks it at any time. If Shopify says it was revoked, the store shows <em>Reconnect</em>.</li>
          <li><strong className="font-normal">Disconnect</strong> deletes the saved secret from Klyroo.</li>
          <li>You can also revoke access in Shopify by uninstalling or deleting the app.</li>
        </UL>
      </>
    ),
  },
  {
    slug: "export/building-exports",
    group: "Klyroo Export",
    title: "Building an export",
    summary: "Choose data, filters, columns, metafields and file format.",
    body: () => (
      <>
        <P>The builder has four steps and a live preview. Start from a template on the Home page, or press <strong className="font-normal">Build from scratch</strong>.</P>
        <H2>1. What to export</H2>
        <Table head={["Export", "One row per", "What it includes"]} rows={resources.map((r) => [r.label, r.id === "products" ? "variant" : r.id === "orders" ? "line item" : r.id === "customers" ? "customer" : r.id === "inventory" ? "item and location" : "collection", `${r.fields.length} columns. ${r.blurb}`])} />
        <H2>2. Filters</H2>
        <Table head={["Filter", "Available for", "Notes"]} rows={[
          ["Status", "Products, orders, customers, inventory", "Product status, order payment status, email marketing status, or stock level (in stock, low stock under 10, out of stock)."],
          ["Tag is", "Products, orders, customers", "Exports only records with that exact tag."],
          ["Created from / to", "Products, orders, customers", "Dates are inclusive."],
        ]} />
        <P>Collections have no filters: they export everything.</P>
        <H2>3. Columns</H2>
        <UL>
          <li>Columns are grouped, for example <em>Variant</em>, <em>Shipping address</em> or <em>Quantities</em>. Open a group, tick what you need, or use <strong className="font-normal">Select all</strong>.</li>
          <li><strong className="font-normal">Essentials</strong> resets to the recommended columns, <strong className="font-normal">All fast columns</strong> selects every column that doesn&apos;t slow the export down, and <strong className="font-normal">Clear</strong> removes your selection.</li>
          <li>In <strong className="font-normal">In your file, in this order</strong> you can reorder columns with the arrows, rename any header, and remove columns.</li>
          <li>The Shopify field name is shown under each column in small type, so you know exactly what it contains.</li>
        </UL>
        <H3>Slow columns</H3>
        <P>A few columns need extra data from Shopify: <em>Variant barcode</em>, <em>All media URLs</em> and <em>Collections</em>. They are marked <strong className="font-normal">Slow</strong>. They work fine, but the export takes longer, especially on large catalogs.</P>
        <H3>Metafields</H3>
        <P>Under the column picker, <strong className="font-normal">Add a metafield</strong> lets you add any metafield as a column. Type it as <Code>namespace.key</Code>, for example <Code>custom.material</Code>. For products you can choose <em>Product</em> or <em>Variant</em> level. Metafields are available for products, orders, customers and collections on every plan.</P>
        <H2>4. Format</H2>
        <Table head={["Option", "When to use it"]} rows={[
          ["CSV for Excel", "Opens correctly in Excel with accents and symbols. Best for most people."],
          ["CSV (UTF-8)", "For systems and scripts that expect plain UTF-8."],
          ["TSV (tabs)", "Tab-separated, for tools that prefer tabs."],
        ]} />
        <P>The <strong className="font-normal">Export name</strong> becomes the file name.</P>
        <H2>Preview and run</H2>
        <UL>
          <li>The preview shows the first rows from your real store and refreshes when you change something.</li>
          <li><strong className="font-normal">Run export</strong> starts the export. It runs in the background, so you can leave the page and find the file in <A href="/docs/export/history-and-files">History</A>.</li>
          <li>Pressing Run twice quickly with identical settings reuses the same export.</li>
        </UL>
        <H2>Good to know</H2>
        <UL>
          <li>Orders include the last 60 days unless your Shopify app has the optional <Code>read_all_orders</Code> permission. Klyroo tells you when this applies.</li>
          <li>Values that start with <Code>=</Code>, <Code>+</Code>, <Code>-</Code> or <Code>@</Code> get a leading apostrophe, so spreadsheets never run them as formulas.</li>
          <li>The file reflects your store at about the time the export ran.</li>
        </UL>
      </>
    ),
  },
  {
    slug: "export/history-and-files",
    group: "Klyroo Export",
    title: "History and files",
    summary: "Find, download and understand your exports.",
    body: () => (
      <>
        <P>Every export appears in <strong className="font-normal">History</strong> with its status, number of rows and size. The list refreshes by itself while something is running.</P>
        <H2>Statuses</H2>
        <Table head={["Status", "Meaning"]} rows={[
          ["Queued", "Waiting to start. If Shopify is busy, a retry is scheduled and the reason is shown."],
          ["Running", "Shopify is preparing your data, or we are building your file."],
          ["Succeeded", "The file is ready to download."],
          ["Failed", "The export couldn't finish. The reason is shown, with what to do."],
        ]} />
        <H2>Downloading</H2>
        <P>Press <strong className="font-normal">Download</strong> on a finished export. Only signed-in members of your account can download it, and each click creates a link that expires within a minute.</P>
        <H2>How long files are kept</H2>
        <P>Files are deleted automatically <strong className="font-normal">7 days</strong> after they were created. After that the row shows <em>Expired</em>. The history entry stays, so you can run the export again.</P>
        <H2>If an export fails</H2>
        <P>Read the message under the export name. Common causes and fixes are in <A href="/docs/export/troubleshooting">Troubleshooting</A>. You can press <strong className="font-normal">Try again</strong> to open the builder.</P>
        <H2>Privacy of your files</H2>
        <P>Exports can contain personal data about your customers. Files are stored privately and are never public. Download them only to places you trust, and delete them when you no longer need them. See our <A href="/privacy">privacy policy</A>.</P>
      </>
    ),
  },
  {
    slug: "export/plans-and-limits",
    group: "Klyroo Export",
    title: "Export plans and limits",
    summary: "What each plan includes and what counts as a row.",
    body: () => (
      <>
        <P>Klyroo Export plans differ in only two ways: <strong className="font-normal">how many stores</strong> you can connect and <strong className="font-normal">how many rows</strong> an export can have.</P>
        <Table head={["Plan", "Price", "Stores", "Rows per export"]} rows={EXPORT_PLANS.map((p) => [p.name, p.priceLabel === "£0" ? "Free" : `${p.priceLabel} / month`, String(p.limits.maxStores), n(p.limits.maxRows)])} />
        <P>{PLAN_COMMON.export}</P>
        <H2>What counts as a row</H2>
        <UL>
          <li>A product export has one row per variant.</li>
          <li>An order export has one row per line item.</li>
          <li>Customers, collections and inventory work as described in <A href="/docs/export/building-exports">Building an export</A>.</li>
        </UL>
        <P>If an export would be larger than your plan allows, it stops with a message telling you the limit. Narrow it with filters, or upgrade.</P>
        <H2>Other limits</H2>
        <UL>
          <li>Up to 30 exports an hour per account, and up to 3 running at once.</li>
          <li>A single file can be up to about 40 MB. If you reach it, narrow the export with filters.</li>
        </UL>
        <H2>Changing plans</H2>
        <P>Open <strong className="font-normal">Billing</strong> in the sidebar. Upgrade or switch plans at any time, and cancel any time. See the <A href="/refunds">refund policy</A>.</P>
      </>
    ),
  },
  {
    slug: "export/troubleshooting",
    group: "Klyroo Export",
    title: "Export troubleshooting",
    summary: "Fixes for the most common problems.",
    body: () => (
      <>
        <Table head={["Problem", "What to do"]} rows={[
          ["The preview shows a permission error", "Your Shopify app is missing a read scope. In the Dev Dashboard add the scope shown in the message, release a new version, approve it on your store, then press Test connection on the Stores page."],
          ["“Inventory exports also need the read_locations permission”", "Add read_locations to your Shopify app, release a new version and reconnect."],
          ["Orders only go back 60 days", "Add the optional read_all_orders scope to your app, release a new version and reconnect."],
          ["The store shows “Reconnect”", "Shopify said the credentials no longer work, usually because the app was uninstalled or its secret changed. Reconnect with the current Client ID and secret."],
          ["“Shopify says bulk exports aren't enabled for this app”", "Shopify must allow bulk queries for your app. Check your app's settings in the Dev Dashboard, or contact us and include the message."],
          ["The export is too large for your plan", "Use filters to reduce the rows, or upgrade for a higher rows limit."],
          ["Accents look wrong in Excel", "Choose the file type CSV for Excel when you build the export."],
          ["A column is empty", "Shopify has no value for that field on those records. Check the Shopify field name shown under the column."],
          ["Export takes a long time", "Slow columns (barcodes, media URLs, collections) and large catalogs take longer. Leave the page and check History."],
          ["The download says expired", "Files are kept for 7 days. Run the export again."],
        ]} />
        <H2>Still stuck?</H2>
        <P>Email {mail} with the name of the export and the message you see. Never send passwords or your Shopify client secret.</P>
      </>
    ),
  },

];

export const docBySlug = (slug: string) => DOCS.find((d) => d.slug === slug);
export const DOC_GROUPS = (["Start here", "Klyroo Export"] as const).map((g) => ({ title: g, items: DOCS.filter((d) => d.group === g).map((d) => ({ slug: d.slug, title: d.title })) }));
