import React, { useEffect, useMemo, useState } from "react";
import { FaRegClipboard, FaRegCheckCircle } from "react-icons/fa";
import { FaTruckFast } from "react-icons/fa6";
import "../styles/OrderStepsBar.css";

type Step = {
  title: string;
  dateText: string;
  icon: React.ReactNode;
  status?: "done" | "active" | "upcoming";
};

type Props = { steps?: Step[] };

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const addDays = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

const OrderStepsBar: React.FC<Props> = ({ steps }) => {
  // ✅ Fast daily auto-update (midnight ke baad max 1 minute me change)
  const [today, setToday] = useState<Date>(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setToday(new Date());
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  const dynamicSteps = useMemo(() => {
    if (steps && steps.length > 0) return steps;

    const dispatchStart = addDays(today, 2);
    const dispatchEnd = addDays(today, 3);

    const deliveryStart = addDays(dispatchStart, 4);
    const deliveryEnd = addDays(dispatchEnd, 4);

    return [
      {
        title: "Order Placed",
        dateText: "Today", // ✅ yahi chahiye
        icon: <FaRegClipboard />,
        status: "done",
      },
      {
        title: "Order Dispatched",
        dateText: `${formatDate(dispatchStart)} - ${formatDate(dispatchEnd)}`,
        icon: <FaTruckFast />,
        status: "active",
      },
      {
        title: "Delivered",
        dateText: `${formatDate(deliveryStart)} - ${formatDate(deliveryEnd)}`,
        icon: <FaRegCheckCircle />,
        status: "upcoming",
      },
    ] as Step[];
  }, [steps, today]);

  return (
    <div className="osb-wrap">
      <div className="osb">
        {dynamicSteps.map((s, idx) => (
          <div key={idx} className={`osb-step osb-${s.status || "upcoming"}`}>
            <div className="osb-icon" aria-hidden>
              {s.icon}
            </div>
            <div className="osb-text">
              <div className="osb-title">{s.title}</div>
              <div className="osb-date">{s.dateText}</div>
            </div>

            {idx !== dynamicSteps.length - 1 && (
              <div className="osb-line" aria-hidden />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderStepsBar;