import React, { useCallback, useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { useDropzone } from 'react-dropzone';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import { useClient } from '../contexts/ClientContexts';
import { useAuth } from '../contexts/AuthContext';
import CustomSelect from '../components/CustomSelect';
import SpreadSheetConfirmBox from '../components/SpreadSheetConfirmBox';
import ClientSelection from '../components/ClientSelection';

const options = [10, 20, 50, 100];

const UploadCsv = () => {
    const { clientObject, setClientObject, createSpreadsheet, getAllClients, getSpreadsheetList, getSpreadsheetData } = useClient()
    const { toast } = useAuth()
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [spreadsheets, setSpreadSheets] = useState([]);
    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState(-1);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [totalRecords, setTotalRecords] = useState(0);
    const [clientId, setClientId] = useState("");
    const [spreadsheetDelId, setSpreadsheetDelId] = useState("")

    const downloadSpreadsheet = async (sheetId) => {
        const sheetData = await getSpreadsheetData(clientId, sheetId)

        const csvData = sheetData?.spreadsheet

        const csvContent = csvData
            .map(row => row.map(item => `"${item || ''}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${sheetData?.name}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 1) {
            toast.current?.show({
                severity: 'error',
                summary: 'File Error',
                detail: 'You can only upload one file at a time.',
                life: 3000,
            });
        } else if (acceptedFiles.length === 1) {
            setFileName(acceptedFiles[0]?.name);
            setFile(acceptedFiles[0]);
        }
    }, []);


    const handleUpload = async () => {
        if (!file) return;
        setIsLoading(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (result) => {
                setIsLoading(false);
                const data = result.data;
                if (data.length > 0) {
                    const headers = Object.keys(data[0]);
                    const formattedData = data.map(row =>
                        headers.map(header => row[header] || '')
                    );

                    setIsLoading(true)
                    const spreadsheet = await createSpreadsheet(clientObject?.value, [headers, ...formattedData], fileName)
                    if (!spreadsheet?.error) {
                        setClientObject("")
                        setFile(null)
                        setFileName("")
                        navigate(`/user/spreadsheet/${clientObject?.value}`)
                    } else {
                        toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: spreadsheet.message, life: 3000 })
                    }
                    setIsLoading(false)
                }
            },
            error: (error) => {
                setIsLoading(false);
                console.error("Error parsing CSV file:", error);
            }
        });
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': [],
        },
        multiple: true
    });

    const fetchClient = async () => {
        const { clients } = await getAllClients(1, 1, "_id", -1, "")
        if (clients.length > 0) {
            setClientObject({
                label: clients[0].entity_name ? clients[0].entity_name : `${clients[0].first_name} ${clients[0].last_name}`,
                value: clients[0]._id,
            })
            setClientId(clients[0]?._id)
        }
    }

    const fetchSpreadsheets = async () => {
        const data = await getSpreadsheetList(clientId, currentPage, rowsPerPage, sortField, sortOrder)
        if (data?.clientSpreadsheets.length > 0) {
            setSpreadSheets(data?.clientSpreadsheets)
            setTotalRecords(data.totalSpreadsheets)
        } else {
            setSpreadSheets([])
            setTotalRecords(0)
        }
    }

    useEffect(() => {
        if (clientId) {
            fetchSpreadsheets();
        }
    }, [clientId, currentPage, rowsPerPage, sortField, sortOrder]);

    const handleCancel = () => {
        setFile(null)
        setFileName("")
    }

    useEffect(() => {
        if (!clientObject?.value) {
            fetchClient()
        } else {
            setClientObject({
                label: clientObject?.label,
                value: clientObject?.value,
            })
            setClientId(clientObject?.value)
        }
    }, [clientObject?.value])

    const handleSelectChange = (option) => {
        setRowsPerPage(option);
    };

    const handleSorting = async (e) => {
        const field = e.sortField;
        const order = e.sortOrder;

        setSortField(field);
        setSortOrder(order);
        fetchSpreadsheets()
    };

    const onPageChange = (event) => {
        const newCurrentPage = Math.floor(event.first / event.rows) + 1;
        setCurrentPage(newCurrentPage);
        const newRowsPerPage = event.rows;
        setRowsPerPage(newRowsPerPage);
    };


    return (
        <>
            <Layout>
                {isLoading ? (
                    <Loader />
                ) : (
                    <>
                        <div className="special_flex d-flex justify-content-space-between">
                            <h1 className="main_title mb-0">Spreadsheet</h1>
                            <h1 className="main_title mb-0">{clientObject?.label}</h1>
                            <ClientSelection className="head_select align-self-end" />
                        </div>
                        <div className="right_flex mb-25 justify-content-end mt-3">
                            <button className="common_btn ms-4 back_to_list" onClick={() => navigate("/user/clients")}>Back To List</button>
                        </div>
                        <div className="sheet_accodian">
                            <div className="accordion" id="accordionExample">
                                <div className="accordion-item dragdrop_box">
                                    <h2 className="accordion-header" id="headingOne">
                                        <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne"
                                            aria-expanded="true" aria-controls="collapseOne">
                                            Drag And Drop File
                                        </button>
                                    </h2>
                                    <div id="collapseOne" className="accordion-collapse collapse show" aria-labelledby="headingOne"
                                        data-bs-parent="#accordionExample">
                                        <div className="accordion-body">
                                            <div className="upload-area" {...getRootProps()}>
                                                <input {...getInputProps()} />
                                                {
                                                    isDragActive ?
                                                        <h2>Drop The Files Here...</h2> :
                                                        <h2 className="text-center">
                                                            Drag And Drop File Here
                                                            <div className="my-2 fw-bold">Or</div>
                                                            <span className="select-file">Click To Select File</span>
                                                        </h2>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {fileName && (
                            <p>{fileName}</p>
                        )}
                        <div className="flex_btn d-flex">
                            {file && clientObject?.value && (
                                <button className={`common_btn cancel_btn`} onClick={handleCancel}>
                                    Cancel
                                </button>
                            )}
                            <button className={`common_btn upload_btn ${(!file || !clientObject?.value) && 'opacity-50'}`} onClick={handleUpload} disabled={!file || !clientObject?.value}>
                                Upload
                            </button>
                        </div>
                        {spreadsheets.length > 0 &&
                            <div className='mt-3'>
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
                                            value={spreadsheets}
                                            first={(currentPage - 1) * rowsPerPage}
                                            onPage={onPageChange}
                                            dataKey="_id"
                                            emptyMessage="No spreadsheet found."
                                            responsiveLayout="scroll"
                                        >
                                            <Column field="name" header="Name" sortable filterField="name" body={(rowData) => (
                                                <span>{`${rowData.name}.csv`}</span>
                                            )} />
                                            <Column header="" className='action_td' align="left" body={(rowData) => (
                                                <div className='d-flex justify-content-center'>
                                                    <button className="green_btn"
                                                        data-toggle="tooltip"
                                                        title="Delete"
                                                        onClick={() => setSpreadsheetDelId(rowData?._id)}
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#delete_client">
                                                        <i className="pi pi-trash" style={{ color: 'white' }}></i>
                                                    </button>
                                                    <button className="green_btn"
                                                        data-toggle="tooltip"
                                                        title="Download"
                                                        onClick={() => downloadSpreadsheet(rowData?._id)}
                                                    >
                                                        <i className="pi pi-download" style={{ color: 'white' }}></i>
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
                            </div>
                        }
                    </>
                )}
            </Layout>
            <SpreadSheetConfirmBox
                clientId={clientId}
                fetchSpreadsheets={fetchSpreadsheets}
                spreadsheetLength={spreadsheets.length}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                spreadsheetDelId={spreadsheetDelId}
                setSpreadsheetDelId={setSpreadsheetDelId}
            />
        </>
    );
};

export default UploadCsv;
