import React, { useState, useEffect } from "react";
import {
  TableRow,
  Grid,
  Typography,
  TableCell,
  Chip,
  Button,
  Checkbox,
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useSelector } from "react-redux";
import { handleSelectedRows } from "helpers/selectedRows";
import {
  changeHospitalTableLimit,
  handleHospitalPageChange,
} from "helpers/filterHelperFunctions";
import EnhancedTable from "./EnhancedTable";
import { Modals, Loader, FormSelect } from "components/Utilities";
import { isSelected } from "helpers/isSelected";
import { availabilityHeadCells } from "components/Utilities/tableHeaders";
import { makeStyles } from "@mui/styles";
import { useTheme } from "@mui/material/styles";
import { hours, days, today } from "components/Utilities/Time";
import { EmptyTable } from "components/layouts";
import { useActions } from "components/hooks/useActions";
import PropTypes from "prop-types";
import { useLazyQuery } from "@apollo/client";
import { defaultPageInfo } from "helpers/mockData";
import {
  getAvailabilities,
  getDoctorAvailabilityForDate,
} from "components/graphQL/useQuery";
const useStyles = makeStyles((theme) => ({
  tableCell: {
    "&.MuiTableCell-root": {
      fontSize: "1.25rem",
    },
  },

  button: {
    "&.MuiButton-root": {
      background: "#fff",
      color: theme.palette.common.grey,
      textTransform: "none",
      borderRadius: "2rem",
      display: "flex",
      alignItems: "center",
      padding: "1rem",
      maxWidth: "10rem",
      whiteSpace: "nowrap",

      "&:hover": {
        background: "#fcfcfc",
      },

      "&:active": {
        background: "#fafafa",
      },

      "& .MuiButton-endIcon>*:nth-of-type(1)": {
        fontSize: "1.2rem",
      },

      "& .MuiButton-endIcon": {
        marginLeft: ".3rem",
        marginTop: "-.2rem",
      },
    },
  },

  badge: {
    "&.MuiChip-root": {
      fontSize: "1.2rem !important",
      height: "2.7rem",
      borderRadius: "1.3rem",
    },
  },
}));

const AvailabilityTable = () => {
  const [pageInfo, setPageInfo] = useState({
    page: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10,
    totalDocs: 0,
  });
  const [modal, setModal] = useState(false);
  const { selectedRows } = useSelector((state) => state.tables);
  const { setSelectedRows } = useActions();
  const [availabilities, setAvailabilities] = useState([]);
  const [select, setSelect] = useState(today());
  const id = localStorage.getItem("partnerProviderId");
  const [fetchAvailabilities, { loading: load }] =
    useLazyQuery(getAvailabilities);
  const [fetchDay, { loading, data: dt }] = useLazyQuery(
    getDoctorAvailabilityForDate
  );
  const [avail, setAvail] = useState("");
  useEffect(() => {
    if (dt) {
      const { available, day, times } = dt?.getDoctorAvailabilityForDate;
      setAvail({
        available,
        day,
        times,
      });
    } else {
      setAvail({
        availale: false,
        day: "Not Available",
        times: [],
      });
    }
  }, [dt]);
  useEffect(() => {
    fetchAvailabilities({
      variables: {
        first: 5,
        providerId: id,
        day: select,
      },
    });
  }, [fetchAvailabilities, select, id]);

  useEffect(() => {
    fetchAvailabilities({
      variables: {
        first: 5,
        providerId: id,
        day: select,
      },
    }).then(({ data }) => {
      if (data) {
        setPageInfo(data?.getAvailabilities?.pageInfo || []);
        setAvailabilities(
          data?.getAvailabilities?.availability || defaultPageInfo
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectChange = async (e) => {
    const { value } = e.target;
    setSelect(value);
    await fetchAvailabilities({
      variables: {
        first: 5,
        providerId: id,
        day: value,
      },
    });
  };
  const setTableData = async (response, errMsg) => {
    response
      .then(({ data }) => {
        setPageInfo(data?.getAvailabilities?.pageInfo || []);
        setAvailabilities(
          data?.getAvailabilities?.availability || defaultPageInfo
        );
      })
      .catch((error) => {
        console.error(error);
      });
  };
  const classes = useStyles();
  const theme = useTheme();
  const handleCheckDay = (day, doctor) => {
    setModal(true);

    fetchDay({
      variables: {
        day,
        doctor,
      },
    });
  };
  if (load) return <Loader />;
  const { day, available, times } = avail;
  return (
    <>
      <Grid item container direction="column" height="100%" rowGap={2}>
        <Grid item container alignItems="center">
          <Grid item flex={1}>
            <Typography variant="h4">Availability Table</Typography>
          </Grid>
          <Grid item>
            <FormSelect
              value={select}
              onChange={handleSelectChange}
              options={days}
              name="select"
            />
          </Grid>
        </Grid>
        {availabilities?.length > 0 ? (
          <Grid
            item
            container
            direction="column"
            overflow="hidden"
            maxWidth={{ md: "100%", sm: "100%", xs: "100%" }}
          >
            <EnhancedTable
              headCells={availabilityHeadCells}
              rows={availabilities}
              paginationLabel="Availabilities per page"
              hasCheckbox={true}
              changeLimit={async (e) => {
                const res = changeHospitalTableLimit(fetchAvailabilities, {
                  first: e,
                  providerId: id,
                  day: select,
                });

                await setTableData(res, "Failed to change table limit.");
              }}
              dataPageInfo={pageInfo}
              handlePagination={async (page) => {
                const res = handleHospitalPageChange(
                  fetchAvailabilities,
                  page,
                  pageInfo,
                  id,
                  {
                    day: select,
                  }
                );
                await setTableData(res, "Failed to change page.");
              }}
            >
              {availabilities?.map((row, index) => {
                const { _id, day, times, doctor, doctorData } = row;
                const labelId = `enhanced-table-checkbox-${index}`;
                const isItemSelected = isSelected(_id, selectedRows);

                return (
                  <TableRow hover tabIndex={-1} key={_id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        onClick={() =>
                          handleSelectedRows(_id, selectedRows, setSelectedRows)
                        }
                        color="primary"
                        checked={isItemSelected}
                        inputProps={{
                          "aria-labelledby": labelId,
                        }}
                      />
                    </TableCell>
                    <TableCell
                      id={labelId}
                      scope="row"
                      align="left"
                      className={classes.tableCell}
                      style={{ color: theme.palette.common.grey }}
                    >
                      {doctorData?.dociId
                        ? doctorData?.dociId?.split("-")[1]
                        : "No Value"}
                    </TableCell>
                    <TableCell align="left" className={classes.tableCell}>
                      <div
                        style={{
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ fontSize: "1.25rem" }}>
                          {doctorData?.firstName
                            ? `${doctorData?.firstName} ${doctorData?.lastName}`
                            : "no name"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell align="left" className={classes.tableCell}>
                      {day ? day : "No Value"}
                    </TableCell>
                    <TableCell align="left" className={classes.tableCell}>
                      <Grid container gap={1}>
                        {times
                          ? times?.map((time, ind) => {
                              const { start, stop } = time;
                              return (
                                <Chip
                                  key={ind}
                                  label={`${hours(start)} - ${hours(stop)} `}
                                  className={classes.badge}
                                  style={{
                                    // background: !!available
                                    //   ? theme.palette.common.lightGreen
                                    //   :
                                    background: theme.palette.common.lightRed,
                                    color:
                                      // !!available
                                      //   ? theme.palette.common.green
                                      //   :
                                      theme.palette.common.red,
                                    // textDecoration: !!available
                                    //   ? ""
                                    //   : "line-through",
                                  }}
                                />
                              );
                            })
                          : "No Time"}
                      </Grid>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        className={classes.button}
                        // component={Link}
                        onClick={() => handleCheckDay(day, doctor)}
                        endIcon={<ArrowForwardIosIcon />}
                      >
                        View Time
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </EnhancedTable>
          </Grid>
        ) : (
          <EmptyTable
            headCells={availabilityHeadCells}
            paginationLabel="Availability  per page"
          />
        )}
      </Grid>
      <Modals
        isOpen={modal}
        title="Available Day"
        rowSpacing={5}
        width="10vw"
        handleClose={() => setModal(false)}
      >
        {loading && <Loader />}
        <Grid item container alignItems="center" gap={2}>
          <Typography variant="h4">{day}</Typography>
          <div
            style={{
              background: available
                ? theme.palette.common.green
                : theme.palette.common.red,
              width: "20px",
              height: "20px",
              borderRadius: "50%",
            }}
          ></div>
        </Grid>
        <Grid item container gap={1}>
          {times
            ? times?.map((time, ind) => {
                const { start, stop } = time;
                return (
                  <Chip
                    key={ind}
                    label={`${hours(start)} - ${hours(stop)} `}
                    className={classes.badge}
                    style={{
                      background: theme.palette.common.lightRed,
                      color: theme.palette.common.red,
                    }}
                  />
                );
              })
            : "No Time"}
        </Grid>
      </Modals>
    </>
  );
};
AvailabilityTable.propTypes = {
  data: PropTypes.object,
};

export default AvailabilityTable;
