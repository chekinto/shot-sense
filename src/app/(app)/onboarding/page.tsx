import { redirect } from "next/navigation";
import { getOrCreateProfile } from "@/features/profile/service";
import { hasCompletedOnboarding } from "@/features/profile/types";
import { OnboardingForm } from "./OnboardingForm";
import styles from "./page.module.css";

export const metadata = { title: "Set up" };

const OnboardingPage = async () => {
  const profile = await getOrCreateProfile();
  if (hasCompletedOnboarding(profile)) redirect("/dashboard");

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1>One quick thing</h1>
        <p>
          Your handicap gives your round analysis a sense of scale. It&rsquo;s the
          only setting we need to get started.
        </p>
      </div>
      <OnboardingForm />
    </div>
  );
};

export default OnboardingPage;
