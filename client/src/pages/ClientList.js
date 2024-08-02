import React, { useEffect, useState } from 'react';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import Loader from '../components/Loader';
import { useClient } from '../contexts/ClientContexts';
import { Link } from 'react-router-dom';
import ClientListLayout from '../components/ClientListLayout';
import AddClient from '../components/AddClient';

const ClientList = () => {
    const { getAllClients, deleteClient } = useClient()

    const [clients, setClients] = useState([]);
    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState(-1);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState(null);
    const [editClientId, setEditClientId] = useState("")
    const [editMode, setEditMode] = useState(false)

    const fetchClients = async () => {
        try {
            setIsLoading(true);
            const clientList = await getAllClients(currentPage, rowsPerPage, sortField, sortOrder, filter);

            if (clientList?.clients?.length !== 0) {
                setClients(clientList?.clients)
                setTotalRecords(clientList.totalClients)
            } else {
                setClients([])
                setTotalRecords(0)
            }
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching clients', error);
        }
    };

    useEffect(() => {
        fetchClients();
    }, [currentPage, rowsPerPage, sortField, sortOrder, filter]);

    const handleSorting = async (e) => {
        const field = e.sortField;
        const order = e.sortOrder;

        setSortField(field);
        setSortOrder(order);
        fetchClients()
    };

    const onPageChange = (event) => {
        const newCurrentPage = Math.floor(event.first / event.rows) + 1;
        setCurrentPage(newCurrentPage);
        const newRowsPerPage = event.rows;
        setRowsPerPage(newRowsPerPage);
    };

    const confirmDelete = async () => {
        return new Promise((resolve) => {
            confirmDialog({
                message: 'Are you sure you want to delete this client?',
                header: 'Delete Confirmation',
                icon: 'pi pi-info-circle',
                position: 'top',
                accept: () => resolve(true),
                reject: () => resolve(false),
            });
        });
    };

    const handleDelete = async (id) => {
        try {
            const confirmed = await confirmDelete();

            if (confirmed) {
                await deleteClient(id);
                fetchClients();
                if (clients?.length === 1) {
                    setCurrentPage(currentPage - 1)
                }
            }
        } catch (error) {
            console.error('Error during delete operation', error);
        }
    }

    const customBodyTemplate = (rowData, columnName) => {
        return rowData[columnName] ? rowData[columnName] : "-";
    };
    return (
        <>
            <ConfirmDialog />
            <ClientListLayout />
            <section className="client_list_section">
                <div className="container">
                    <div className="bg_white_box m-20">
                        <div className="special_flex mb-25">
                            <h1 className="main_title">Client List</h1>
                            <div className="right_flex">
                                <div className="search_box">
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        onChange={(e) => setFilter(e.target.value)}
                                    />
                                </div>
                                <button className="common_btn ms-4" data-bs-toggle="modal" data-bs-target="#add_client">
                                    <img src="/images/plus_white.svg" alt="" /> Add Client
                                </button>
                                <button className="common_btn ms-4">Import</button>
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
                                    onSort={(e) => {
                                        if (!e.sortField && e.sortOrder === 0) {
                                            handleSorting({ sortField: 'createdAt', sortOrder: -1 });
                                        } else {
                                            handleSorting(e);
                                        }
                                    }}
                                    removableSort
                                    rows={rowsPerPage}
                                    value={clients}
                                    first={(currentPage - 1) * rowsPerPage}
                                    onPage={onPageChange}
                                    dataKey="id"
                                    emptyMessage="No clients found."
                                    responsiveLayout="scroll"
                                >
                                    <Column
                                        field="first_name"
                                        header="First Name"
                                        body={(rowData) => customBodyTemplate(rowData, 'first_name')}
                                        sortable
                                        filterField="first_name"
                                    />
                                    <Column
                                        field="last_name"
                                        header="Last Name"
                                        body={(rowData) => customBodyTemplate(rowData, 'last_name')}
                                        sortable
                                        filterField="last_name"
                                    />
                                    <Column f
                                        ield="entity_name"
                                        header="Entity Name"
                                        body={(rowData) => customBodyTemplate(rowData, 'entity_name')}
                                        sortable
                                        filterField="entity_name"
                                    />
                                    <Column
                                        field="preferred_name"
                                        header="Preferred Name"
                                        body={(rowData) => customBodyTemplate(rowData, 'preferred_name')}
                                        sortable
                                    />
                                    <Column
                                        field="abn_number"
                                        header="ABN Number" body={(rowData) => customBodyTemplate(rowData, 'abn_number')}
                                        sortable
                                    />
                                    <Column
                                        field="email"
                                        className='table-email-field'
                                        header="Email Address"
                                        body={(rowData) => customBodyTemplate(rowData, 'email')}
                                        sortable
                                        filterField="email"
                                    />
                                    <Column
                                        field="phone"
                                        header="Phone Number"
                                        body={(rowData) => customBodyTemplate(rowData, 'phone')}
                                        sortable
                                    />
                                    <Column
                                        field="address"
                                        header="Address"
                                        body={(rowData) => customBodyTemplate(rowData, 'address')}
                                        sortable
                                    />
                                    <Column
                                        field="client_code" header="Client Code"
                                        body={(rowData) => customBodyTemplate(rowData, 'client_code')}
                                        sortable
                                    />
                                    <Column
                                        field="user_defined"
                                        header="User Defined"
                                        body={(rowData) => customBodyTemplate(rowData, 'user_defined')}
                                        sortable
                                    />
                                    <Column
                                        header=""
                                        className='action_td'
                                        align="left"
                                        body={(rowData) => (
                                            <div className='d-flex'>
                                                <Link to={`/user/chart-of-accounts/${rowData?._id}`} className="green_btn">
                                                    <img src="/images/chart.svg" alt="Chart" />
                                                </Link>
                                                <Link to="/file" className="green_btn">
                                                    <img src="/images/file.svg" alt="File" />
                                                </Link>
                                                <button
                                                    className="green_btn"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#add_client"
                                                    onClick={() => {
                                                        setEditClientId(rowData?._id)
                                                        setEditMode(true)
                                                    }}
                                                >
                                                    <img src="/images/edit.svg" alt="Edit" />
                                                </button>
                                                <button className="green_btn" onClick={() => handleDelete(rowData?._id)}>
                                                    <img src="/images/delete.svg" alt="Delete" />
                                                </button>
                                            </div>
                                        )}
                                    />
                                </DataTable>
                            )}
                        </div>
                        <div className="entries_page">
                            <select name="" id="" onChange={(e) => setRowsPerPage(e.target.value)}>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                            <label>entries per page </label>
                        </div>
                        <Paginator
                            first={(currentPage - 1) * rowsPerPage}
                            rows={rowsPerPage}
                            totalRecords={totalRecords}
                            onPageChange={onPageChange}
                        />
                    </div>
                </div>
            </section >

            {/* Modals for Add and Edit Client here */}
            <AddClient
                editMode={editMode}
                editClientId={editClientId}
                setEditClientId={setEditClientId}
                setEditMode={setEditMode}
                fetchClients={fetchClients}
                setCurrentPage={setCurrentPage}
            />
        </>
    );
};

export default ClientList;
