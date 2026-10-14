const holdings = [
  { asset: "US Equity", weight: 0.45 },
  { asset: "International Equity", weight: 0.2 },
  { asset: "Fixed Income", weight: 0.25 },
  { asset: "Cash", weight: 0.1 },
];

export function PortfolioTable() {
  return (
    <table>
      <thead>
        <tr>
          <th>Asset</th>
          <th>Weight</th>
        </tr>
      </thead>
      <tbody>
        {holdings.map((holding) => (
          <tr key={holding.asset}>
            <td>{holding.asset}</td>
            <td>{(holding.weight * 100).toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
