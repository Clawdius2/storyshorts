import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="pageWrap">
      <SignIn />
    </div>
  );
}
