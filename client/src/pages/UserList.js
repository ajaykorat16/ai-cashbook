import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import Loader from '../components/Loader';
import Layout from '../components/Layout';
import CustomSelect from '../components/CustomSelect';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from 'primereact/badge';

const UserList = () => {
    const options = [10, 20, 50, 100];
    const { getUsers, updateStatus } = useAuth()

    const [users, setUsers] = useState([]);
    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState(-1);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState(null);
    let debounceTimeout = null;

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const userList = await getUsers(currentPage, rowsPerPage, sortField, sortOrder, filter);
            if (userList?.users?.length !== 0) {
                setUsers(userList?.users)
                setTotalRecords(userList.totalUsers)
            } else {
                setUsers([])
                setTotalRecords(0)
            }
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching users', error);
        }
    };


    useEffect(() => {
        fetchUsers();
    }, [currentPage, rowsPerPage, sortField, sortOrder, filter]);

    const handleSorting = async (e) => {
        const field = e.sortField;
        const order = e.sortOrder;

        setSortField(field);
        setSortOrder(order);
        fetchUsers()
    };

    const onPageChange = (event) => {
        const newCurrentPage = Math.floor(event.first / event.rows) + 1;
        setCurrentPage(newCurrentPage);
        const newRowsPerPage = event.rows;
        setRowsPerPage(newRowsPerPage);
    };


    const handleSearch = (e) => {
        const value = e.target.value;
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }
        debounceTimeout = setTimeout(() => {
            setFilter(value);
            setCurrentPage(1);
        }, 500);
    };

    const customBodyTemplate = (rowData, columnName) => {
        if (columnName === 'active') {
            return rowData[columnName] === true ? (
                <Badge value="Active" severity="success"></Badge>
            ) : (
                <Badge value="Inactive" severity="danger"></Badge>
            )
        }
        return rowData[columnName] ? rowData[columnName] : "-";
    };

    const handleSelectChange = (option) => {
        setRowsPerPage(option);
    };

    const handleStatus = async (id, status) => {
        await updateStatus(id, status)
        fetchUsers()
    }

    return (
        <>
            <Layout showSelection={false}>
                <div className="special_flex mb-25">
                    <h1 className="main_title">User list</h1>
                    <div className="right_flex">
                        <div className="search_box">
                            <input
                                type="search"
                                placeholder="Search"
                                onChange={(e) => handleSearch(e)}
                            />
                        </div>
                    </div>
                </div>
                <div className="main_table">
                    {isLoading ? (
                        <Loader />
                    ) : (
                        <DataTable
                            className="dataTable"
                            totalRecords={totalRecords}
                            lazy
                            sortField={sortField}
                            sortOrder={sortOrder}
                            onSort={handleSorting}
                            removableSort
                            rows={rowsPerPage}
                            value={users}
                            first={(currentPage - 1) * rowsPerPage}
                            onPage={onPageChange}
                            dataKey="_id"
                            emptyMessage="No users found."
                            responsiveLayout="scroll"
                        >
                            <Column field="first_name" header="First name" body={(rowData) => customBodyTemplate(rowData, 'first_name')} sortable filterField="first_name" />
                            <Column field="last_name" header="Last name" body={(rowData) => customBodyTemplate(rowData, 'last_name')} sortable filterField="last_name" />
                            <Column field="email" header="Email" body={(rowData) => customBodyTemplate(rowData, 'email')} sortable filterField="email" />
                            <Column field="phone" header="Phone" body={(rowData) => customBodyTemplate(rowData, 'phone')} sortable filterField="phone" />
                            <Column field="active" header="Status" body={(rowData) => customBodyTemplate(rowData, 'active')} sortable />
                            <Column header="" className='action_td' align="left" body={(rowData) => (
                                <div className='d-flex'>
                                    <button
                                        className={`common_btn ms-4 status-btn ${rowData?.active ? 'bg-danger' : 'bg-success'}`}
                                        onClick={() => handleStatus(rowData._id, rowData?.active ? false : true)}
                                    >
                                        {rowData?.active ? 'Deactive' : 'Active'}
                                    </button>

                                </div>
                            )} />
                        </DataTable>
                    )}
                </div>
                <div className="entries_page">
                    <CustomSelect
                        options={options}
                        onChange={handleSelectChange}
                        defaultValue={10}
                    />
                </div>
                <Paginator
                    first={(currentPage - 1) * rowsPerPage}
                    rows={rowsPerPage}
                    totalRecords={totalRecords}
                    onPageChange={onPageChange}
                />
            </Layout >
        </>
    );
};

export default UserList;
