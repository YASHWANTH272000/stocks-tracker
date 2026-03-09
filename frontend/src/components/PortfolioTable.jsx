import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Table from "../helpers/Table";
import { getPortfolio } from "../services/api";

function PortfolioTable() {
  const [activeTab, setActiveTab] = useState("portfolio");
  const { data, isLoading, error } = useQuery({
    queryKey: ["portfolio"],
    queryFn: getPortfolio,
    refetchInterval: 15000
  });

  const stocks = data?.stocks || [];

  const columns = useMemo(() => [
    { header: "Particular", accessorKey: "particular" },
    { header: "Purchase Price", accessorKey: "purchasePrice" },
    { header: "Quantity", accessorKey: "qty" },
    { header: "Investment", accessorKey: "investment" },
    { header: "Portfolio(%)", accessorKey: "portfolio" },
    { header: "Symbol", accessorKey: "symbol" },
    { header: "CMP", accessorKey: "cmp" },
    { header: "Present Value", accessorKey: "presentValue" },
    {
      header: "Gain/Loss",
      accessorKey: "gainLoss",
      cell: info => {
        const value = info.getValue();
        return (
          <span
            className={`font-semibold ${
              value > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {value}
          </span>
        );
      }
    },
    { header: "P/E ratio", accessorKey: "peRatio" },
    { header: "Latest Earnings", accessorKey: "latestEarnings" }
  ], []);

  if (isLoading) return <p className="p-4">Loading portfolio...</p>;

  if (error) return <p className="p-4 text-red-500">Error while loading portfolio!</p>;

  return (
    <div className="p-4">
      <div className="bg-white shadow-lg rounded-xl p-4">

      <div className="flex gap-4 mb-4">

        <button
          onClick={() => setActiveTab("portfolio")}
          className={`px-4 py-2 rounded ${
            activeTab === "portfolio"
              ? "bg-blue-600 tex underline"
              : "bg-gray-200"
          }`}
        >
          Portfolio
        </button>

        <button
          onClick={() => setActiveTab("sector")}
          className={`px-4 py-2 rounded ${
            activeTab === "sector"
              ? "bg-blue-600 text underline"
              : "bg-gray-200"
          }`}
        >
          Sector Wise
        </button>

      </div>
      {activeTab === "portfolio" && (
        <>    
        <p style={{fontSize: "12px", color: "red"}}>
           Disclaimer:  Should not be used for financial decisions.
        </p>
        <Table data={stocks} columns={columns} />
        </>
      )}
      {activeTab === "sector" && (
        <div className="space-y-8">

          {Object.entries(data.sectors).map(([sectorName, sector]) => (
            
            <div key={sectorName}>

              <h3 className="text-lg font-bold mb-2">
                {sectorName}
              </h3>

              <div className="text-sm mb-2 text-gray-600">
                Invested: {sector.invested.toFixed(2)} | 
                Value: {sector.value.toFixed(2)} | 
                Gain/Loss: {sector.gainLoss.toFixed(2)}
              </div>

              <Table
                data={sector.items}
                columns={columns}
              />

            </div>

          ))}

        </div>
      )}
      </div>
    </div>
  );
}

export default PortfolioTable;