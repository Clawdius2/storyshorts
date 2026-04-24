import Link from "next/link";

export default function SubscribeCancelPage() {
  return (
    <div className="pageWrap">
      <div className="emptyState">
        <h2>Checkout canceled</h2>
        <p>No charges were made. You can keep browsing the free shelf or try again later.</p>
        <Link href="/subscribe" className="buttonPrimary">
          Return to membership
        </Link>
      </div>
    </div>
  );
}
