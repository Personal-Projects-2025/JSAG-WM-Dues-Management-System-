import React from 'react';

/**
 * Generic skeleton loader component
 */
export const Skeleton = ({ className = '', width, height }) => {
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={style}
      aria-label="Loading"
      role="status"
    />
  );
};

/**
 * Table row skeleton
 */
export const TableRowSkeleton = ({ columns = 5 }) => (
  <tr>
    {Array.from({ length: columns }).map((_, idx) => (
      <td key={idx} className="px-6 py-4">
        <Skeleton height="20px" />
      </td>
    ))}
  </tr>
);

/**
 * Card skeleton
 */
export const CardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <Skeleton height="24px" width="60%" className="mb-4" />
    <Skeleton height="16px" width="100%" className="mb-2" />
    <Skeleton height="16px" width="80%" />
  </div>
);

/**
 * Dashboard stats skeleton
 */
export const StatsCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <Skeleton height="16px" width="40%" className="mb-2" />
        <Skeleton height="32px" width="60%" />
      </div>
      <Skeleton width="48px" height="48px" className="rounded-full" />
    </div>
  </div>
);

/**
 * Form skeleton
 */
export const FormSkeleton = ({ fields = 4 }) => (
  <div className="space-y-4">
    {Array.from({ length: fields }).map((_, idx) => (
      <div key={idx}>
        <Skeleton height="16px" width="30%" className="mb-2" />
        <Skeleton height="40px" width="100%" />
      </div>
    ))}
    <div className="flex justify-end gap-3 mt-6">
      <Skeleton height="40px" width="100px" />
      <Skeleton height="40px" width="100px" />
    </div>
  </div>
);

/**
 * List item skeleton
 */
export const ListItemSkeleton = () => (
  <div className="flex items-center gap-4 p-4 border-b">
    <Skeleton width="48px" height="48px" className="rounded-full" />
    <div className="flex-1">
      <Skeleton height="20px" width="40%" className="mb-2" />
      <Skeleton height="16px" width="60%" />
    </div>
    <Skeleton height="32px" width="80px" />
  </div>
);

/**
 * Table skeleton with header
 */
export const TableSkeleton = ({ rows = 5, columns = 5 }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="px-6 py-4 border-b">
      <Skeleton height="24px" width="30%" />
    </div>
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {Array.from({ length: columns }).map((_, idx) => (
            <th key={idx} className="px-6 py-3">
              <Skeleton height="16px" width="80%" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <TableRowSkeleton key={rowIdx} columns={columns} />
        ))}
      </tbody>
    </table>
  </div>
);

export default Skeleton;


