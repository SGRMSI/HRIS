import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';

export default function ProcessedIndex({ processed, employees, filters }) {
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter state
    const [filterEmployee, setFilterEmployee] = useState(filters.employee_id || '');
    const [filterDateFrom, setFilterDateFrom] = useState(filters.date_from || '');
    const [filterDateTo, setFilterDateTo] = useState(filters.date_to || '');
    const [filterStatus, setFilterStatus] = useState(filters.status || '');

    const statusOptions = [
        { id: '', name: 'All Statuses' },
        { id: 'Present', name: 'Present' },
        { id: 'Incomplete', name: 'Incomplete' },
    ];

    // Handle filter changes
    const handleFilterChange = () => {
        router.get(route('attendance.processed.index'), {
            employee_id: filterEmployee,
            date_from: filterDateFrom,
            date_to: filterDateTo,
            status: filterStatus,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Handle pushing records to final
    const handlePushToFinal = async () => {
        if (!selectedRecords.length) return;

        setIsSubmitting(true);
        try {
            await router.post(route('attendance.processed.finalize'), {
                records: selectedRecords,
            });
            setSelectedRecords([]);
        } catch (error) {
            console.error('Failed to push records:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Toggle record selection
    const toggleRecord = (recordId) => {
        setSelectedRecords(prev => 
            prev.includes(recordId)
                ? prev.filter(id => id !== recordId)
                : [...prev, recordId]
        );
    };

    // Toggle all records
    const toggleAll = () => {
        setSelectedRecords(prev => 
            prev.length === processed.data.length
                ? []
                : processed.data.map(record => record.id)
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present':
                return 'text-green-700 bg-green-50 ring-green-600/20';
            case 'Incomplete':
                return 'text-red-700 bg-red-50 ring-red-600/20';
            default:
                return 'text-gray-600 bg-gray-50 ring-gray-500/10';
        }
    };

    return (
        <>
            <Head title="Processed Attendance Records" />

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Filters */}
                <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6 mb-6">
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-4">
                        <div>
                            <label htmlFor="employee" className="block text-sm font-medium text-gray-700">
                                Employee
                            </label>
                            <select
                                id="employee"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                value={filterEmployee}
                                onChange={(e) => setFilterEmployee(e.target.value)}
                            >
                                <option value="">All Employees</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="date-from" className="block text-sm font-medium text-gray-700">
                                Date From
                            </label>
                            <input
                                type="date"
                                id="date-from"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                value={filterDateFrom}
                                onChange={(e) => setFilterDateFrom(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="date-to" className="block text-sm font-medium text-gray-700">
                                Date To
                            </label>
                            <input
                                type="date"
                                id="date-to"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                value={filterDateTo}
                                onChange={(e) => setFilterDateTo(e.target.value)}
                            />
                        </div>

                        <div>
                            <Listbox value={filterStatus} onChange={setFilterStatus}>
                                <Listbox.Label className="block text-sm font-medium text-gray-700">Status</Listbox.Label>
                                <div className="relative mt-1">
                                    <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                                        <span className="block truncate">
                                            {statusOptions.find(option => option.id === filterStatus)?.name || 'All Statuses'}
                                        </span>
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </span>
                                    </Listbox.Button>

                                    <Transition
                                        leave="transition ease-in duration-100"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                            {statusOptions.map((option) => (
                                                <Listbox.Option
                                                    key={option.id}
                                                    value={option.id}
                                                    className={({ active }) =>
                                                        `relative cursor-default select-none py-2 pl-3 pr-9 ${
                                                            active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                                        }`
                                                    }
                                                >
                                                    {option.name}
                                                </Listbox.Option>
                                            ))}
                                        </Listbox.Options>
                                    </Transition>
                                </div>
                            </Listbox>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={handleFilterChange}
                            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="mb-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            checked={selectedRecords.length === processed.data.length}
                            onChange={toggleAll}
                        />
                        <span className="ml-2 text-sm text-gray-500">
                            {selectedRecords.length} records selected
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handlePushToFinal}
                        disabled={isSubmitting || !selectedRecords.length}
                        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Processing...' : 'Push Selected to Final'}
                    </button>
                </div>

                {/* Records Table */}
                <div className="mt-4 flex flex-col">
                    <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                                                <input
                                                    type="checkbox"
                                                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
                                                    checked={selectedRecords.length === processed.data.length}
                                                    onChange={toggleAll}
                                                />
                                            </th>
                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                                                Employee
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Date
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Clock In
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Break Out
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Break In
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Clock Out
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Total Hours
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {processed.data.map((record) => (
                                            <tr key={record.id}>
                                                <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                                                    <input
                                                        type="checkbox"
                                                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
                                                        checked={selectedRecords.includes(record.id)}
                                                        onChange={() => toggleRecord(record.id)}
                                                    />
                                                </td>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                                    {record.employee.name}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {format(new Date(record.date), 'MMM d, yyyy')}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {record.clock_in || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {record.break_out || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {record.break_in || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {record.clock_out || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {record.total_hours ? `${record.total_hours} hrs` : '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(record.status)}`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pagination */}
                {processed.links && (
                    <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                        <div className="flex flex-1 justify-between sm:hidden">
                            {processed.prev_page_url && (
                                <a
                                    href={processed.prev_page_url}
                                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Previous
                                </a>
                            )}
                            {processed.next_page_url && (
                                <a
                                    href={processed.next_page_url}
                                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Next
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}