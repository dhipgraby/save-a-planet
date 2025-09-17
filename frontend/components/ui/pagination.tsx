import { PaginationType } from "@/types/transactions-types";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const PaginationButtons = (
  { pagination, onPageChange, previousPage, nextPage }
    :
    {
      pagination: PaginationType,
      onPageChange: (page: number) => void,
      previousPage: number,
      nextPage: number
    }) => {

  return (
    <>
      <div className="flex flex-wrap space-x-2">
        <div className="border-2 rounded-md p-2">
          <p>Total pages: {pagination?.totalPages}</p>
        </div>

        <div className="border-2 rounded-md p-2">
          <p>Total items: {pagination?.totalItems}</p>
        </div>
      </div>


      <div className="flex mt-4 w-fit space-x-2">
        <button
          onClick={() => onPageChange(previousPage)}
          disabled={pagination?.currentPage === 1}
          className="mt-2 p-1 px-2 text-xs items-center rounded-md border-2 flex"
        >
          <ChevronLeft />  {previousPage} - Prev
        </button>
        <button
          className="mt-2 p-1 px-2 text-xs items-center rounded-md border-2 flex"
        >
          Current page: {pagination?.currentPage}
        </button>
        <button
          onClick={() => onPageChange(nextPage)}
          disabled={pagination?.currentPage === pagination?.totalPages}
          className="mt-2 p-1 px-2 text-xs items-center rounded-md border-2 flex"
        >
          Next - {nextPage}<ChevronRight />
        </button>
      </div>
    </>
  );
};

export const PaginationBottom = ({ pagination, onPageChange, previousPage, nextPage }
  :
  {
    pagination: PaginationType,
    onPageChange: (page: number) => void,
    previousPage: number,
    nextPage: number
  }) => {
  return (<div className="flex justify-between mt-4">
    <button
      onClick={() => onPageChange(previousPage)}
      disabled={pagination?.currentPage === 1}
      className="border-2 rounded-md p-2"
    >
      Previous {previousPage}
    </button>
    <button
      onClick={() => onPageChange(nextPage)}
      disabled={pagination?.currentPage === pagination?.totalPages}
      className="border-2 rounded-md p-2"
    >
      Next {nextPage}
    </button>
  </div>);
};