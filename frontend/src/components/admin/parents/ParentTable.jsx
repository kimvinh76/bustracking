import { useState } from 'react';
import PropTypes from 'prop-types';
import Table from '../../common/Table';

const ParentTable = ({ parents = [], loading = false, onAdd, onEdit, onView, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('');

  const uniqueRelationships = [
    ...new Set(parents.map((p) => p.relationship).filter(Boolean)),
  ].sort();

  if (loading) {
    return (
      <div className="mx-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
          <p className="text-gray-500 mt-4">Đang tải danh sách phụ huynh...</p>
        </div>
      </div>
    );
  }

  const filteredParents = parents.filter((parent) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      parent.name?.toLowerCase().includes(q) ||
      parent.email?.toLowerCase().includes(q) ||
      parent.username?.toLowerCase().includes(q) ||
      parent.phone?.includes(searchTerm);

    const matchesRelationship =
      !relationshipFilter || parent.relationship === relationshipFilter;

    return matchesSearch && matchesRelationship;
  });

  const columns = [
    {
      key: 'name',
      header: 'Họ tên',
    },
    {
      key: 'relationship',
      header: 'Quan hệ',
      render: (value) => value || <span className="text-slate-400 italic">Chưa rõ</span>,
    },
    {
      key: 'username',
      header: 'Tài khoản',
      render: (value) =>
        value ? (
          <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            {value}
          </span>
        ) : (
          <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            Chưa có TK
          </span>
        ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (value) => (
        <div style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value && value !== 'Chưa có' ? value : 'Chưa có'}
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Số điện thoại',
    },
    {
      key: 'address',
      header: 'Địa chỉ',
      render: (value) => (
        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value || '--'}
        </div>
      ),
    },
    {
      key: 'children_count',
      header: 'Con em',
      render: (value, row) => {
        const childrenCount = (value ?? row?.children_count) || 0;
        if (childrenCount === 0) {
          return <span className="text-slate-400 italic">Chưa có</span>;
        }
        return (
          <span className="text-sm font-medium text-blue-600">{childrenCount} con</span>
        );
      },
    },
  ];

  const filters = [
    {
      placeholder: 'Tất cả quan hệ',
      value: relationshipFilter,
      onChange: setRelationshipFilter,
      options: uniqueRelationships.map((rel) => ({ value: rel, label: rel })),
      minWidth: '140px',
    },
  ];

  return (
    <Table
      title="Quản lý Phụ huynh"
      data={filteredParents}
      columns={columns}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      onAdd={onAdd}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      addButtonText="Thêm phụ huynh"
      filters={filters}
      emptyMessage={
        searchTerm || relationshipFilter
          ? 'Không tìm thấy phụ huynh nào phù hợp'
          : 'Chưa có phụ huynh nào'
      }
    />
  );
};

ParentTable.propTypes = {
  parents: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onAdd: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default ParentTable;
