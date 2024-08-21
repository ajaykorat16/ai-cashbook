import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import Loader from '../components/Loader';
import { useClient } from '../contexts/ClientContexts';
import { Link, useNavigate } from 'react-router-dom';
import ClientListLayout from '../components/ClientListLayout';
import AddClient from '../components/AddClient';
import ConfirmDeleteBox from '../components/ConfirmDeleteBox';
import CustomSelect from '../components/CustomSelect';

const ClientList = () => {
    const options = [10, 20, 50, 100];
    const navigate = useNavigate()
    const { getAllClients, clientsWithoutPagination } = useClient()

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
    const [visible, setVisible] = useState(false)
    const [clientDelId, setClientDelId] = useState("")
    let debounceTimeout = null;

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

    const handleExports = async () => {
        const clientList = await clientsWithoutPagination();

        if (clientList?.clients?.length > 0) {
            const csvContent = convertToCSV(clientList.clients);
            downloadCSV(csvContent, "clients.csv");
        }
    };

    const convertToCSV = (data) => {
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ];
        return csvRows.join('\n');
    };

    const downloadCSV = (csvContent, filename) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
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

    const customBodyTemplate = (rowData, columnName) => {
        return rowData[columnName] ? rowData[columnName] : "-";
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

    const handleSelectChange = (option) => {
        setRowsPerPage(option);
    };

    return (
        <>
            <ClientListLayout showSelection={false}>
                <div className="special_flex mb-25">
                    <h1 className="main_title">Client list</h1>
                    <div className="right_flex">
                        <div className="search_box">
                            <input
                                type="search"
                                placeholder="Search"
                                onChange={(e) => handleSearch(e)}
                            />
                        </div>
                        <button className="common_btn ms-4" data-bs-toggle="modal" data-bs-target="#add_client" onClick={() => setVisible(true)}>
                            <img src="/images/plus_white.svg" alt="" /> Add client
                        </button>
                        <button className="common_btn ms-4" onClick={() => navigate('/user/upload-clients')}>Import</button>
                        <button className="common_btn ms-4" onClick={() => handleExports()}>Export</button>
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
                            value={clients}
                            first={(currentPage - 1) * rowsPerPage}
                            onPage={onPageChange}
                            dataKey="_id"
                            emptyMessage="No clients found."
                            responsiveLayout="scroll"
                        >
                            <Column field="first_name" header="First name" body={(rowData) => customBodyTemplate(rowData, 'first_name')} sortable filterField="first_name" />
                            <Column field="last_name" header="Last name" body={(rowData) => customBodyTemplate(rowData, 'last_name')} sortable filterField="last_name" />
                            <Column field="entity_name" header="Entity name" body={(rowData) => customBodyTemplate(rowData, 'entity_name')} sortable filterField="entity_name" />
                            <Column field="preferred_name" header="Preferred name" body={(rowData) => customBodyTemplate(rowData, 'preferred_name')} sortable />
                            <Column field="abn_number" header="ABN number" body={(rowData) => customBodyTemplate(rowData, 'abn_number')} sortable />
                            <Column field="email" className='table-email-field' header="Email Address" body={(rowData) => customBodyTemplate(rowData, 'email')} sortable filterField="email" />
                            <Column field="phone" header="Phone number" body={(rowData) => customBodyTemplate(rowData, 'phone')} sortable />
                            <Column field="address" header="Address" body={(rowData) => customBodyTemplate(rowData, 'address')} sortable />
                            <Column field="client_code" header="Client code" body={(rowData) => customBodyTemplate(rowData, 'client_code')} sortable />
                            <Column field="user_defined" header="User defined" body={(rowData) => customBodyTemplate(rowData, 'user_defined')} sortable />
                            <Column header="" className='action_td' align="left" body={(rowData) => (
                                <div className='d-flex'>
                                    <Link className="green_btn">
                                        <img src="/images/chart.svg" alt="Chart" />
                                    </Link>
                                    <Link className="green_btn">
                                        <img src="/images/file.svg" alt="File" />
                                    </Link>
                                    <button className="green_btn" data-bs-toggle="modal" data-bs-target="#add_client" onClick={() => {
                                        setEditClientId(rowData?._id);
                                        setEditMode(true);
                                    }}>
                                        <img src="/images/edit.svg" alt="Edit" />
                                    </button>
                                    <button className="green_btn"
                                        onClick={() => setClientDelId(rowData?._id)}
                                        data-bs-toggle="modal"
                                        data-bs-target="#delete_client">
                                        <img src="/images/delete.svg" alt="Delete" />
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
                    {/* <label>Entries per page </label> */}
                </div>
                <Paginator
                    first={(currentPage - 1) * rowsPerPage}
                    rows={rowsPerPage}
                    totalRecords={totalRecords}
                    onPageChange={onPageChange}
                />
            </ClientListLayout >

            {/* Modals for Add and Edit Client here */}
            <AddClient
                editMode={editMode}
                editClientId={editClientId}
                setEditClientId={setEditClientId}
                setEditMode={setEditMode}
                fetchClients={fetchClients}
                setCurrentPage={setCurrentPage}
                visible={visible}
                setVisible={setVisible}
            />
            <ConfirmDeleteBox
                fetchClients={fetchClients}
                clientsLength={clients?.length}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                clientDelId={clientDelId}
                setClientDelId={setClientDelId}
            />
        </>
    );
};

export default ClientList;
