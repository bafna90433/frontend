import React from "react";
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

const defaultSteps: Step[] = [
  { title: "Order Placed", dateText: "Feb 20", icon: <FaRegClipboard />, status: "done" },
  { title: "Order Dispatched", dateText: "Feb 22 - Feb 23", icon: <FaTruckFast />, status: "active" },
  { title: "Delivered", dateText: "Feb 26 - Feb 27", icon: <FaRegCheckCircle />, status: "upcoming" },
];

const OrderStepsBar: React.FC<Props> = ({ steps = defaultSteps }) => {
  return (
    <div className="osb-wrap">
      <div className="osb">
        {steps.map((s, idx) => (
          <div key={idx} className={`osb-step osb-${s.status || "upcoming"}`}>
            <div className="osb-icon" aria-hidden>{s.icon}</div>
            <div className="osb-text">
              <div className="osb-title">{s.title}</div>
              <div className="osb-date">{s.dateText}</div>
            </div>
            {idx !== steps.length - 1 && <div className="osb-line" aria-hidden />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderStepsBar;