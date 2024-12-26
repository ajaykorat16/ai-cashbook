import { useContext, createContext, useState } from "react";
import { baseURL } from "../lib";
import axios from 'axios'
import moment from 'moment';
import { useAuth } from "./AuthContext";

const ClientContext = createContext()

const ClientProvider = ({ children }) => {
    const { auth, toast } = useAuth()
    const [clientObject, setClientObject] = useState("")
    const [clientsAvalible, setClientsAvalible] = useState(true)
    const [showInterBank, setShowInterBank] = useState(false)

    const headers = {
        Authorization: auth?.token,
    };

    const createClient = async (clientDetail) => {
        try {
            const { data } = await axios.post(`${baseURL}/client/create`, clientDetail, { headers });
            if (data.error === false) {
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: 'Client', detail: data.message, life: 3000 })
                }, 500);
            } else {
                toast.current?.show({ severity: 'error', summary: 'Client', detail: data.message, life: 3000 })
            }
            return data
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    if (errors.length > 1) {
                        toast.current?.show({ severity: 'error', summary: 'Client', detail: "Please fill all mandatory fields.", life: 3000 })
                    } else {
                        toast.current?.show({ severity: 'error', summary: 'Client', detail: errors[0].msg, life: 3000 })
                    }
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Client', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    }

    const getSingleClient = async (id) => {
        try {
            let { data } = await axios.get(`${baseURL}/client/single-client/${id}`, { headers })
            if (data.error === false) {
                return data.client
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Client', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const getSharedClient = async (id) => {
        try {
            let { data } = await axios.get(`${baseURL}/client/shared-client/${id}`, { headers })
            return data
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Client', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const getLastClientCode = async (id) => {
        try {
            let { data } = await axios.get(`${baseURL}/client/lastclient-code`, { headers })
            if (data.error === false) {
                return data
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Client', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const getAllClients = async (currentPage, rowsPerPage, sortField, sortOrder, filter) => {
        try {
            const { data } = await axios.get(`${baseURL}/client?&sortField=${sortField}&sortOrder=${sortOrder}&page=${currentPage}&limit=${rowsPerPage}&filter=${filter !== '' ? filter : null}`, { headers })
            if (data.error === false) {
                return data
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Client', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const clientsWithoutPagination = async () => {
        try {
            const { data } = await axios.get(`${baseURL}/client/clients-without-pagination`, { headers })
            if (data.error === false) {
                return data
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Client', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const updateClient = async (id, clientDetail) => {
        try {
            const { data } = await axios.put(`${baseURL}/client/update/${id}`, clientDetail, { headers });
            if (data.error === false) {
                toast.current?.show({ severity: 'success', summary: 'Client', detail: data.message, life: 3000 })
            } else {
                toast.current?.show({ severity: 'error', summary: 'Client', detail: data.message, life: 3000 })
            }
            return data
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    if (errors.length > 1) {
                        toast.current?.show({ severity: 'error', summary: 'Client', detail: "Please fill all mandatory fields.", life: 3000 })
                    } else {
                        toast.current?.show({ severity: 'error', summary: 'Client', detail: errors[0].msg, life: 3000 })
                    }
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Client', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    }

    const deleteClient = async (id) => {
        try {
            const { data } = await axios.delete(`${baseURL}/client/delete/${id}`, { headers });
            if (data.error === false) {
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: 'Client', detail: data.message, life: 3000 })
                }, 500);
                localStorage.removeItem(`fromDate_${id}`);
                localStorage.removeItem(`toDate_${id}`);
                return data
            } else {
                toast.current?.show({ severity: 'error', summary: 'Client', detail: data.message, life: 3000 })
                return data;
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Client', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const deleteSpreadsheet = async (clientId, id) => {
        try {
            const { data } = await axios.post(`${baseURL}/client/delete-spreadsheet`, { clientId, sheetId: id }, { headers });
            if (data.error === false) {
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: 'Spreadsheet', detail: data.message, life: 3000 })
                }, 300);
                return data
            } else {
                toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: data.message, life: 3000 })
                return data;
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const getSpreadsheetData = async (clientId, sheetId) => {
        try {
            let { data } = await axios.get(`${baseURL}/client/spreadsheet-data?clientId=${clientId}&&sheetId=${sheetId}`, { headers })
            if (data.error === false) {
                return data
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Client Category', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const getClientCategory = async (id) => {
        try {
            let { data } = await axios.get(`${baseURL}/client/category/${id}`, { headers })
            if (data.error === false) {
                return data?.clientCategory
            }
        } catch (error) {
            // toast.current?.show({ severity: 'error', summary: 'Client Category', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const getSpreadsheet = async (id, fromDate, toDate) => {
        try {
            let { data } = await axios.get(`${baseURL}/client/spreadsheet/${id}?fromDate=${fromDate}&&toDate=${toDate}`, { headers })
            if (data.error === false) {
                return data
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const getSpreadsheetList = async (id, currentPage, rowsPerPage, sortField, sortOrder) => {
        try {
            let { data } = await axios.get(`${baseURL}/client/spreadsheet-list/${id}?&sortField=${sortField}&sortOrder=${sortOrder}&page=${currentPage}&limit=${rowsPerPage}`, { headers })
            if (data.error === false) {
                return data
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const updateClientCatrgory = async (id, csvData, deletedCategory, updatedCategory) => {
        try {
            const { data } = await axios.put(`${baseURL}/client/update-category/${id}`, { data: csvData, deletedCategory, updatedCategory }, { headers });
            if (data.error === false) {
                return data;
            } else {
                toast.current?.show({ severity: 'error', summary: 'Client Category', detail: data.message, life: 3000 })
            }
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    toast.current?.show({ severity: 'error', summary: 'Client Category', detail: errors[0].msg, life: 3000 })
                }
            } else {
                // toast.current?.show({ severity: 'error', summary: 'Client Category', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    }

    const createSpreadsheet = async (id, csvData, fileName) => {
        try {
            const { data } = await axios.post(`${baseURL}/client/create-spreasheet/${id}`, { data: csvData, fileName }, { headers });
            if (data.error === false) {
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: 'Spreadsheet', detail: data.message, life: 3000 })
                }, 500);
            }
            return data;
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: errors[0].msg, life: 3000 })
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    }

    const autoCategorize = async (id, fromDate, toDate) => {
        try {
            const { data } = await axios.post(`${baseURL}/client/auto-categorize/${id}`, { fromDate, toDate }, { headers });
            if (data.error === false) {
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: 'Spreadsheet', detail: data.message, life: 3000 })
                }, 1000);
                return data;
            } else {
                setTimeout(function () {
                    toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: data.message, life: 3000 })
                }, 1000);
            }
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: errors[0].msg, life: 3000 })
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    }

    const updateSpreadsheet = async (id, csvData) => {
        try {
            const { data } = await axios.put(`${baseURL}/client/update-spreasheet/${id}`, { data: csvData }, { headers });
            if (data.error === false) {
                return data;
            } else {
                toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: data.message, life: 3000 })
            }
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: errors[0].msg, life: 3000 })
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    }

    const importClient = async (clients, isInsert) => {
        try {
            const { data } = await axios.post(`${baseURL}/client/import`, { clients, isInsert }, { headers });
            if (data.error === false && isInsert) {
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: 'Client', detail: data.message, life: 3000 })
                }, 500);
            } else if (isInsert) {
                toast.current?.show({ severity: 'error', summary: 'Client', detail: data.message, life: 3000 })
            }
            return data
        } catch (error) {

        }
    }

    const multipleDeleteClient = async (selectedClientIds) => {
        try {
            const { data } = await axios.post(`${baseURL}/client/bulk-delete`, { selectedClientIds }, { headers });
            if (data.error === false) {
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: 'Client', detail: data.message, life: 3000 })
                }, 500);

                const clients = JSON.parse(selectedClientIds);
                if (clients.length > 0) {
                    for (let i = 0; i < clients.length; i++) {
                        const id = clients[i];
                        if (id) {
                            localStorage.removeItem(`fromDate_${id}`);
                            localStorage.removeItem(`toDate_${id}`);
                        }
                    }
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Client', detail: data.message, life: 3000 })
            }
            return data
        } catch (error) {

        }
    }

    const getGstReport = async (id, fromDate, toDate) => {
        try {
            let { data } = await axios.get(`${baseURL}/client/gst-report/${id}?fromDate=${fromDate}&&toDate=${toDate}`, { headers })
            if (data.error === false) {
                return data.data
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Gst Report', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const getItrReport = async (id, fromDate, toDate) => {
        try {
            let { data } = await axios.get(`${baseURL}/client/itr-report/${id}?fromDate=${fromDate}&&toDate=${toDate}`, { headers })
            if (data.error === false) {
                return data.data
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Itr Report', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }


    const showDateRange = (option) => {
        let startDate, endDate, rangeText;

        switch (option) {
            case 'thisMonth':
                startDate = moment().startOf('month');
                endDate = moment().endOf('month');
                rangeText = `${startDate.format('MMM YYYY')}`;
                break;

            case 'lastMonth':
                startDate = moment().subtract(1, 'months').startOf('month');
                endDate = moment().subtract(1, 'months').endOf('month');
                rangeText = `${startDate.format('MMM YYYY')}`;
                break;

            case 'thisQuarter':
                startDate = moment().startOf('quarter');
                endDate = moment().endOf('quarter');
                rangeText = `${startDate.format('D MMM')} - ${endDate.format('D MMM YYYY')}`;
                break;

            case 'lastQuarter':
                startDate = moment().subtract(1, 'quarters').startOf('quarter');
                endDate = moment().subtract(1, 'quarters').endOf('quarter');
                rangeText = `${startDate.format('D MMM')} - ${endDate.format('D MMM YYYY')}`;
                break;

            case 'thisYear':
                startDate = moment().startOf('year');
                endDate = moment().endOf('year');
                rangeText = `1 Jan - 31 Dec ${endDate.format('YYYY')}`;
                break;

            case 'lastYear':
                startDate = moment().subtract(1, 'years').startOf('year');
                endDate = moment().subtract(1, 'years').endOf('year');
                rangeText = `1 Jan - 31 Dec ${startDate.format('YYYY')}`;
                break;

            case 'currentMonthToDate':
                startDate = moment().startOf('month');
                endDate = moment();
                rangeText = `${startDate.format('D MMM')} - ${endDate.format('D MMM YYYY')}`;
                break;

            case 'currentQuarterToDate':
                startDate = moment().startOf('quarter');
                endDate = moment();
                rangeText = `${startDate.format('D MMM')} - ${endDate.format('D MMM YYYY')}`;
                break;

            case 'currentYearToDate':
                startDate = moment().startOf('year');
                endDate = moment();
                rangeText = `${startDate.format('D MMM')} - ${endDate.format('D MMM YYYY')}`;
                break;

            default:
                startDate = null;
                endDate = null;
                rangeText = '';
                break;
        }
        return rangeText
    };

    const calculateDateRange = (option) => {
        let startDate, endDate;

        switch (option) {
            case 'thisMonth':
                startDate = moment().startOf('month');
                endDate = moment().endOf('month');
                break;

            case 'lastMonth':
                startDate = moment().subtract(1, 'months').startOf('month');
                endDate = moment().subtract(1, 'months').endOf('month');
                break;

            case 'thisQuarter':
                startDate = moment().startOf('quarter');
                endDate = moment().endOf('quarter');
                break;

            case 'lastQuarter':
                startDate = moment().subtract(1, 'quarters').startOf('quarter');
                endDate = moment().subtract(1, 'quarters').endOf('quarter');
                break;

            case 'thisYear':
                startDate = moment().startOf('year');
                endDate = moment().endOf('year');
                break;

            case 'lastYear':
                startDate = moment().subtract(1, 'years').startOf('year');
                endDate = moment().subtract(1, 'years').endOf('year');
                break;

            case 'currentMonthToDate':
                startDate = moment().startOf('month');
                endDate = moment();
                break;

            case 'currentQuarterToDate':
                startDate = moment().startOf('quarter');
                endDate = moment();
                break;

            case 'currentYearToDate':
                startDate = moment().startOf('year');
                endDate = moment();
                break;

            default:
                startDate = null;
                endDate = null;
                break;
        }
        startDate = startDate ? startDate.format('MM/DD/YYYY') : ''
        endDate = endDate ? endDate.format('MM/DD/YYYY') : ''
        localStorage.setItem(`fromDate_${clientObject?.value}`, startDate);
        localStorage.setItem(`toDate_${clientObject?.value}`, endDate);
        return {
            startDate, endDate
        }
    };


    const changeSheetName = async (id, name) => {
        try {
            const { data } = await axios.post(`${baseURL}/client/change-sheetname/${id}`, { sheet_name: name }, { headers });
            if (data.error === false) {
                return data;
            } else {
                toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: data.message, life: 3000 })
            }
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: errors[0].msg, life: 3000 })
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    }

    const shareSheet = async (id, is_shared) => {
        try {
            const { data } = await axios.post(`${baseURL}/client/share-spreadsheet/${id}`, { is_shared }, { headers });
            if (data.error === false) {
                return data.url;
            } else {
                toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: data.message, life: 3000 })
            }
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: errors[0].msg, life: 3000 })
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    }

    return (
        <ClientContext.Provider value={{
            createClient, getSingleClient, getAllClients, clientsWithoutPagination, updateClient, deleteSpreadsheet, getSharedClient,
            getSpreadsheet, updateSpreadsheet, createSpreadsheet, autoCategorize, getSpreadsheetList, getSpreadsheetData, calculateDateRange,
            deleteClient, getClientCategory, updateClientCatrgory, clientObject, setClientObject, clientsAvalible, setClientsAvalible, shareSheet,
            multipleDeleteClient, getLastClientCode, getItrReport, getGstReport, importClient, showInterBank, setShowInterBank, showDateRange, changeSheetName
        }}>
            {children}
        </ClientContext.Provider>
    )
}

const useClient = () => useContext(ClientContext)
export { useClient, ClientProvider }