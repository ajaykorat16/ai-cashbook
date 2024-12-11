import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';
import { useClient } from '../contexts/ClientContexts';
import Loader from './Loader'
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from '@iconify/react';

const UploadCsv = () => {
    const navigate = useNavigate()
    const { importClient } = useClient()
    const { toast } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [files, setFiles] = useState([])
    const [fileName, setFileName] = useState("")
    const [failedImports, setFailedImports] = useState([])
    const [disabledUpload, setDiasbledUpload] = useState(true)

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 1) {
            toast.current?.show({
                severity: 'error',
                summary: 'File Error',
                detail: 'You can only upload one file at a time.',
                life: 3000,
            });
            setFiles([]);
            setFileName('');
            setDiasbledUpload(true);
        } else if (acceptedFiles.length === 1) {
            setFileName(acceptedFiles[0]?.name);
            setFiles(acceptedFiles);
            handleUpload(acceptedFiles, false);
            setDiasbledUpload(false);
        } else {
            setDiasbledUpload(true);
        }
    }, []);
    

    const csvToObject = (csvData) => {
        const rows = csvData.split('\n').filter(row => row.trim() !== '');

        const headers = rows[0].split(',').map(header => header.trim());

        return rows.slice(1).map(row => {
            const values = parseCSVRow(row);

            while (values.length < headers.length) {
                values.push('');
            }

            let obj = {};
            headers.forEach((header, index) => {
                const key = header.toLowerCase().replace(/\s+/g, '_');
                obj[key] = values[index] || '';
            });

            return obj;
        });
    };

    const parseCSVRow = (row) => {
        const regex = /(?<=,|^)(?=,|$)|(".*?"|[^",\n]+)(?=\s*,|\s*$)/g;

        const matches = [...row.matchAll(regex)].map(match => match[1] || match[2] || '').filter(value => value !== undefined);

        return matches.map(value => {
            if (value.startsWith('"') && value.endsWith('"')) {
                return value.slice(1, -1);
            }
            return value.trim();
        });
    };


    const validateRowData = async (rowData) => {
        for (const row of rowData) {
            const clientInfo = {
                abn_number: row?.abn_number || "",
                preferred_name: row?.preferred_name || "",
                phone: row?.phone || "",
                client_code: row?.client_code?.trim() ? row?.client_code?.trim() : "",
                email: row?.email || "",
                user_defined: row?.user_defined || "",
                address: row?.address || "",
                entity_name: row?.entity_name || "",
                first_name: row?.first_name || "",
                last_name: row?.last_name || "",
                individual: row?.individual || ""
            };

            return clientInfo
        }
    };

    const handleUpload = async (csvFiles, isInsert) => {
        const clientsToImport = []
        setIsLoading(true);

        for (const fileIndex in csvFiles) {
            const file = csvFiles[fileIndex];
            const reader = new FileReader();

            reader.onload = async (event) => {
                const csvData = event.target.result;
                const rowData = csvToObject(csvData);

                for (const rowIndex in rowData) {
                    const row = rowData[rowIndex];
                    const clientInfo = await validateRowData([row]);
                    if (clientInfo !== null) {
                        clientsToImport.push(clientInfo)
                    }

                    if (parseInt(fileIndex) === csvFiles.length - 1 && parseInt(rowIndex) === rowData.length - 1) {
                        const data = await importClient(JSON.stringify(clientsToImport), isInsert)
                        setFailedImports(data.failedClients)
                        setIsLoading(false);
                        if (isInsert) {
                            setFiles([]);
                            navigate("/user/clients");
                        } else {
                            if (data?.error) {
                                toast.current?.show({ severity: 'error', summary: 'Client', detail: data.message, life: 3000 })
                            } else {
                                toast.current?.show({ severity: 'success', summary: 'Client', detail: data.message, life: 3000 })
                            }
                        }
                    }
                }
            };
            reader.readAsText(file);
            await new Promise((resolve) => reader.onloadend = resolve);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': [],
        },
        multiple: true
    });

    const customBodyTemplate = (rowData, columnName, errors) => {
        const fieldErrors = rowData?.errors?.filter(errorObj => errorObj.field === columnName) || [];

        if (fieldErrors.length > 0) {
            setDiasbledUpload(true);

            return (
                <div className='d-flex flex-column'>
                    <span>{rowData[columnName] || "-"}</span>
                    {fieldErrors.map((error, index) => (
                        <span key={index} className='text-danger small'>{error.message}</span>
                    ))}
                </div>
            );
        }

        return <span>{rowData[columnName] || "-"}</span>;
    };

    const handleCancel = () => {
        setFiles([]);
        setDiasbledUpload(true)
        setFileName("")
        setFailedImports([])
    }

    const handleExports = () => {
        const clientList = [
            {
                entity_name: "Demo",
                abn_number: "DEMOUSER",
                preferred_name: "Demo User",
                phone: "1234567890",
                email: "demo@gmail.com",
                client_code: "DE0001",
                user_defined: "true",
                address: "test",
                individual: "No",
            }
        ]

        const csvContent = convertToCSV(clientList);
        downloadCSV(csvContent, "sample_clients.csv");
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

    return (
        <>
            <Layout>
                {isLoading ? (
                    <Loader />
                ) :
                    (
                        <>
                            <div className="special_flex mb-25">
                                <h1 className="main_title">Upload Clients</h1>
                                <div className="right_flex">
                                    <button className="common_btn ms-4" onClick={() => handleExports()}>
                                        <Icon icon="material-symbols:download" className='icon_for_btn' style={{ color: '#4dd0a6' }} />Sample File
                                    </button>
                                    <button className="common_btn ms-4" onClick={() => navigate("/user/clients")}>
                                        Back To List
                                    </button>
                                </div>
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
                                                            <h2>
                                                                Drop The Files Here...
                                                            </h2> :
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
                            {failedImports.length > 0 && (
                                <div className="main_table mt-3">
                                    <DataTable
                                        className="dataTable"
                                        value={failedImports}
                                        dataKey="client_code"
                                        emptyMessage="No users found."
                                        responsiveLayout="scroll"
                                    >
                                        <Column field="first_name" header="First Name" body={(rowData) => customBodyTemplate(rowData, 'first_name')} />
                                        <Column field="last_name" header="Last Name" body={(rowData) => customBodyTemplate(rowData, 'last_name')} />
                                        <Column field="entity_name" header="Entity Name" body={(rowData) => customBodyTemplate(rowData, 'entity_name')} />
                                        <Column field="preferred_name" header="Preferred Name" body={(rowData) => customBodyTemplate(rowData, 'preferred_name')} />
                                        <Column field="abn_number" header="ABN Number" body={(rowData) => customBodyTemplate(rowData, 'abn_number')} />
                                        <Column field="email" className='table-email-field' header="Email Address" body={(rowData) => customBodyTemplate(rowData, 'email')} />
                                        <Column field="phone" header="Phone Number" body={(rowData) => customBodyTemplate(rowData, 'phone')} />
                                        <Column field="address" header="Address" body={(rowData) => customBodyTemplate(rowData, 'address')} />
                                        <Column field="client_code" header="Client Code" body={(rowData) => customBodyTemplate(rowData, 'client_code')} />
                                        <Column field="user_defined" header="User Defined" body={(rowData) => customBodyTemplate(rowData, 'user_defined')} />
                                    </DataTable>
                                </div>
                            )}
                            <div className="flex_btn">
                                {files?.length > 0 && (
                                    <button className={`common_btn cancel_btn`} onClick={handleCancel}>
                                        Cancel
                                    </button>
                                )}
                                <button className={`common_btn upload_btn ${disabledUpload && 'opacity-50'}`} onClick={() => handleUpload(files, true)} disabled={disabledUpload}>Upload</button>
                            </div>
                        </>
                    )}
            </Layout>
        </>
    );
};

export default UploadCsv;
