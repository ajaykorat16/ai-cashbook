import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';
import { useClient } from '../contexts/ClientContexts';
import Loader from './Loader'
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useAuth } from '../contexts/AuthContext';

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
        setFileName(acceptedFiles[0]?.name)
        setFiles(acceptedFiles)
        handleUpload(acceptedFiles, false);
        if (acceptedFiles.length <= 0) {
            setDiasbledUpload(true)
        } else if (acceptedFiles.length > 0) {
            setDiasbledUpload(false)
        }
    }, []);

    const csvToObject = (csvData) => {
        const rows = csvData.split('\n').filter(row => row.trim() !== '');
        const headers = rows[0].split(',').map(header => header.trim());

        return rows.slice(1).map(row => {
            const values = row.split(',').map(value => {
                value = value.trim();
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                return value || '';
            });

            let obj = {};
            headers.forEach((header, index) => {
                const key = header.toLowerCase().replace(/\s+/g, '_');
                obj[key] = values[index] || '';
            });
            return obj;
        });
    };

    const validateRowData = async (rowData) => {
        for (const row of rowData) {
            const clientCode = row?.client_code?.trim();
            const hasClientCode = clientCode !== '' && typeof clientCode !== 'undefined';

            if (hasClientCode) {
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
            } else {
                return null
            }
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
        multiple: false
    });

    const customBodyTemplate = (rowData, columnName, errors) => {
        const error = rowData?.errors?.find(errorObj => errorObj.field === columnName);

        if (error) {
            setDiasbledUpload(true);
            return (
                <div className='d-flex flex-column'>
                    <span>{rowData[columnName] || "-"}</span>
                    <span className='text-danger small'>{error.message}</span>
                </div>
            );
        }
        return rowData[columnName] ? rowData[columnName] : "-";
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
                                <h1 className="main_title">Spreadsheet</h1>
                                <div className="right_flex">
                                    <button className="common_btn ms-4" onClick={() => navigate("/user/clients")}>
                                        <img src="images/pre_white.svg" alt="" /> Back to list
                                    </button>
                                </div>
                            </div>
                            <div className="sheet_accodian">
                                <div className="accordion" id="accordionExample">
                                    <div className="accordion-item dragdrop_box">
                                        <h2 className="accordion-header" id="headingOne">
                                            <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne"
                                                aria-expanded="true" aria-controls="collapseOne">
                                                Drag and Drop file
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
                                                                Drop the files here...
                                                            </h2> :
                                                            <h2 className="text-center">
                                                                Drag and Drop file here
                                                                <div className="my-2 fw-bold">Or</div>
                                                                <span className="select-file">Click to select file</span>
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
                                        <Column field="first_name" header="First name" body={(rowData) => customBodyTemplate(rowData, 'first_name')} />
                                        <Column field="last_name" header="Last name" body={(rowData) => customBodyTemplate(rowData, 'last_name')} />
                                        <Column field="entity_name" header="Entity name" body={(rowData) => customBodyTemplate(rowData, 'entity_name')} />
                                        <Column field="preferred_name" header="Preferred name" body={(rowData) => customBodyTemplate(rowData, 'preferred_name')} />
                                        <Column field="abn_number" header="ABN number" body={(rowData) => customBodyTemplate(rowData, 'abn_number')} />
                                        <Column field="email" className='table-email-field' header="Email address" body={(rowData) => customBodyTemplate(rowData, 'email')} />
                                        <Column field="phone" header="Phone number" body={(rowData) => customBodyTemplate(rowData, 'phone')} />
                                        <Column field="address" header="Address" body={(rowData) => customBodyTemplate(rowData, 'address')} />
                                        <Column field="client_code" header="Client code" body={(rowData) => customBodyTemplate(rowData, 'client_code')} />
                                        <Column field="user_defined" header="User defined" body={(rowData) => customBodyTemplate(rowData, 'user_defined')} />
                                    </DataTable>
                                </div>
                            )}
                            <div className="flex_btn">
                                <button className={`common_btn ${disabledUpload && 'opacity-50'}`} onClick={() => handleUpload(files, true)} disabled={disabledUpload}>Upload</button>
                            </div>
                        </>
                    )}
            </Layout>
        </>
    );
};

export default UploadCsv;
