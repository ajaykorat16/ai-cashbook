import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import Loader from '../components/Loader';
import { useClient } from '../contexts/ClientContexts';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import AddClient from '../components/AddClient';
import ConfirmDeleteBox from '../components/ConfirmDeleteBox';
import CustomSelect from '../components/CustomSelect';
import ConfirmMultiDelete from '../components/ConfirmMultiDelete';
import { Icon } from '@iconify/react';
import { useAuth } from '../contexts/AuthContext';

const ClientList = () => {
    const options = [10, 20, 50, 100];
    const navigate = useNavigate()
    const { getAllClients, clientsWithoutPagination, setClientsAvalible } = useClient()
    const { auth } = useAuth()

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
    const [selectedClients, setSelectedClients] = useState([]);
    let debounceTimeout = null;

    const fetchClients = async () => {
        try {
            setIsLoading(true);
            const clientList = await getAllClients(currentPage, rowsPerPage, sortField, sortOrder, filter);

            if (clientList?.clients?.length !== 0) {
                setClients(clientList?.clients)
                setTotalRecords(clientList.totalClients)
                setClientsAvalible(true)
            } else {
                setClients([])
                setTotalRecords(0)
                setClientsAvalible(false)
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
            downloadCSV(csvContent, `${auth?.user?.first_name}_clients.csv`);
        }
    };
    const convertToCSV = (data) => {
        const requiredHeaders = ['first_name', 'last_name', 'entity_name'];

        const dataHeaders = new Set(Object.keys(data[0] || {}));
        const allHeaders = [...new Set([...requiredHeaders, ...dataHeaders])];

        const csvRows = [
            allHeaders.join(','),
            ...data.map(row =>
                allHeaders.map(header => `"${row[header] || ''}"`).join(',')
            )
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
        const handleCopy = (event) => {
            const selectedText = window.getSelection().toString();
            const textWithoutSpaces = selectedText.replace(/\s+/g, '');
            event.clipboardData.setData('text/plain', textWithoutSpaces);
            event.preventDefault();
        };
        document.addEventListener('copy', handleCopy);

        return () => {
            document.removeEventListener('copy', handleCopy);
        };
    }, []);

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
        if (columnName === 'phone') {
            const formattedPhone = formatPhoneNumberWithSpaces(rowData[columnName]);
            return (
                <span className="phone-number">
                    {formattedPhone ? formattedPhone : "-"}
                </span>
            );
        }
        return rowData[columnName] ? rowData[columnName] : "-";
    };

    const formatPhoneNumberWithSpaces = (phoneNumber) => {
        return phoneNumber.replace(/(\+?\d{1,3})?(\(?\d{2,4}\)?)?(\d{4})(\d{3})(\d{3})/, (match, p1, p2, p3, p4, p5) => {
            let formattedNumber = '';
            if (p1) formattedNumber += `${p1.trim()} `;
            if (p2) formattedNumber += `${p2.trim()} `;
            formattedNumber += `${p3} ${p4} ${p5}`;
            return formattedNumber;
        });
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

    const handleRowSelect = (e) => {
        const selectedRow = e.value;
        setSelectedClients(selectedRow);
    };

    const handleRowClick = (rowData) => {
        navigate(`/user/spreadsheet/${rowData._id}`);
    };

    return (
        <>
            <Layout>
                <div className="special_flex mb-25 title_container">
                    <h1 className="main_title">Client List</h1>
                    <div className="right_flex">
                        <div className="search_box">
                            <input
                                type="search"
                                placeholder="Search"
                                onChange={(e) => handleSearch(e)}
                            />
                        </div>
                        <button className="common_btn ms-4" data-bs-toggle="modal" data-bs-target="#add_client" onClick={() => setVisible(true)}>
                            Add Client
                        </button>
                        <button className="common_btn ms-4" onClick={() => navigate('/user/upload-clients')}>
                            <Icon icon="ep:arrow-down-bold" className='icon_for_btn' style={{ color: '#4dd0a6' }} />Import
                        </button>
                        <button className="common_btn ms-4" onClick={() => handleExports()}>
                            <Icon icon="ep:arrow-up-bold" className='icon_for_btn' style={{ color: '#4dd0a6' }} /> Export
                        </button>
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
                            selection={selectedClients}
                            onSelectionChange={handleRowSelect}
                            onRowClick={(e) => handleRowClick(e.data)}
                        >
                            <Column selectionMode="multiple" checked={selectedClients.length === clients.length} />
                            <Column field="first_name" header="First Name" body={(rowData) => customBodyTemplate(rowData, 'first_name')} sortable filterField="first_name" />
                            <Column field="last_name" header="Last Name" body={(rowData) => customBodyTemplate(rowData, 'last_name')} sortable filterField="last_name" />
                            <Column field="entity_name" header="Entity Name" body={(rowData) => customBodyTemplate(rowData, 'entity_name')} sortable filterField="entity_name" />
                            <Column field="preferred_name" header="Preferred Name" body={(rowData) => customBodyTemplate(rowData, 'preferred_name')} sortable />
                            <Column field="abn_number" header="ABN Number" body={(rowData) => customBodyTemplate(rowData, 'abn_number')} sortable />
                            <Column field="email" className='table-email-field' header="Email Address" body={(rowData) => customBodyTemplate(rowData, 'email')} sortable filterField="email" />
                            <Column field="phone" header="Phone number" body={(rowData) => customBodyTemplate(rowData, 'phone')} sortable />
                            <Column field="address" header="Address" body={(rowData) => customBodyTemplate(rowData, 'address')} sortable />
                            <Column field="client_code" header="Client Code" body={(rowData) => customBodyTemplate(rowData, 'client_code')} sortable />
                            <Column field="user_defined" header="User Defined" body={(rowData) => customBodyTemplate(rowData, 'user_defined')} sortable />
                            <Column header="" className='action_td' align="left" body={(rowData) => (
                                <div className='d-flex'>
                                    <Link to={`/user/spreadsheet/${rowData._id}`} className="green_btn" data-toggle="tooltip" title="Spreadsheet">
                                        <img src="/images/chart.svg" alt="Chart" />
                                    </Link>
                                    <Link to={`/user/chart-of-accounts/${rowData._id}`} className="green_btn" data-toggle="tooltip" title="Category">
                                        <img src="/images/file.svg" alt="File" />
                                    </Link>
                                    <button className="green_btn" data-bs-toggle="modal" data-bs-target="#add_client" data-toggle="tooltip" title="Edit" onClick={() => {
                                        setEditClientId(rowData?._id);
                                        setEditMode(true);
                                    }}>
                                        <img src="/images/edit.svg" alt="Edit" />
                                    </button>
                                    <button className="green_btn"
                                        data-toggle="tooltip"
                                        title="Delete"
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
                    {selectedClients.length > 0 && (
                        <button className="common_btn ms-4" data-bs-toggle="modal" data-bs-target="#delete_multi_client">Delete All </button>
                    )}
                    {/* <label>Entries per page </label> */}
                </div>
                <Paginator
                    first={(currentPage - 1) * rowsPerPage}
                    rows={rowsPerPage}
                    totalRecords={totalRecords}
                    onPageChange={onPageChange}
                />
            </Layout >

            {/* Modals for Add and Edit Client here */}
            < AddClient
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
            <ConfirmMultiDelete
                fetchClients={fetchClients}
                clientsLength={clients?.length}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                selectedClients={selectedClients}
                setSelectedClients={setSelectedClients}
            />
        </>
    );
};

export default ClientList;
