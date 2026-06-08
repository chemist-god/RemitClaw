import dynamic from "next/dynamic";

const AuthFlow = dynamic(
  () => import("../../components/AuthFlow").then((m) => m.AuthFlow),
  {
    loading: () => (
      <div className="phone">
        <div className="screen flex flex-1 flex-col items-center justify-center px-7">
          <div className="h-64 w-64 animate-pulse rounded-full bg-surface-subtle" />
          <div className="mt-8 h-8 w-56 animate-pulse rounded bg-surface-subtle" />
        </div>
      </div>
    ),
  }
);

export default function AuthScreen() {
  return <AuthFlow />;
}
