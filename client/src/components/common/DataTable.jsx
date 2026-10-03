export default function DataTable({
  columns,
  data,
  keyField = "_id",
  emptyMessage = "No records found.",
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="table-loading">
        <div className="spinner-ring" />
        <span>Loading records…</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-empty">
        <span className="empty-icon">◌</span>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th
                key={col.key || index}
                style={col.width ? { width: col.width } : undefined}
                className={col.className || ""}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row[keyField] || rowIndex}>
              {columns.map((col, colIndex) => (
                <td key={col.key || colIndex} className={col.className || ""}>
                  {col.render ? col.render(row, rowIndex) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
