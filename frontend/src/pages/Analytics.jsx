import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Select } from "antd";
const { Option } = Select;
import { getAttendanceTrends } from "../services/api";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Analytics = () => {
  const [trends, setTrends] = useState({ labels: [], data: [] });
  const [selectedUnit, setSelectedUnit] = useState("unit1");

  useEffect(() => {
    const fetchData = async () => {
      const trendsRes = await getAttendanceTrends(selectedUnit);
      setTrends(trendsRes);
    };
    fetchData();
  }, [selectedUnit]);

  const data = {
    labels: trends.labels,
    datasets: [
      {
        label: "Attendance Rate",
        data: trends.data,
        fill: false,
        borderColor: "rgba(75,192,192,1)",
      },
    ],
  };

  return (
    <div className="p-4">
      <h2>Attendance Trends</h2>
      <Select
        placeholder="Select Unit"
        style={{ width: 200, marginBottom: 16 }}
        onChange={(value) => setSelectedUnit(value)}
        value={selectedUnit}
      >
        <Option value="unit1">Unit 1</Option>
        <Option value="unit2">Unit 2</Option>
        <Option value="unit3">Unit 3</Option>
      </Select>
      <Line data={data} />
    </div>
  );
};

export default Analytics;