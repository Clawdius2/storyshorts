import Link from "next/link";

export default function SubscribeSuccessPage() {
  return (
    <div className="pageWrap">
      <div className="emptyState">
        <h2>Membership active</h2>
        <p>Your subscription is set up. Open the catalog and start listening to premium titles.</p>
        <Link href="/catalog" className="buttonPrimary">
          Go to catalog
        </Link>
      </div>
    </div>
  );
}
