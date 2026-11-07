import confetti from "canvas-confetti";
import toast from "react-hot-toast";

export function celebratePaymentSuccess(message: string) {
  confetti({
    particleCount: 120,
    spread: 70,
    origin: { y: 0.65 },
  });
  toast.success(message, { duration: 6000 });
}
