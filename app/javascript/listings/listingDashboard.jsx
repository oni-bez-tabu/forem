import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { ListingRow } from './dashboard/listingRow';

export const ListingDashboard = () => {
  const [listings, setListings] = useState([]);
  const [orgListings, setOrgListings] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [userCredits, setUserCredits] = useState(0);
  const [selectedListings, setSelectedListings] = useState('user');
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('created_at');

  useEffect(() => {
    const container = document.getElementById('listings-dashboard');

    const listings = JSON.parse(container.dataset.listings).sort((a, b) =>
      a.created_at > b.created_at ? -1 : 1,
    );

    setListings(listings);
    setOrgs(JSON.parse(container.dataset.orgs));
    setOrgListings(JSON.parse(container.dataset.orglistings));
    setUserCredits(container.dataset.usercredits);
  }, []);

  const isExpired = (listing) =>
    listing.bumped_at && !listing.published
      ? (Date.now() - new Date(listing.bumped_at.toString()).getTime()) /
          (1000 * 60 * 60 * 24) >
        30
      : false;

  const isDraft = (listing) =>
    listing.bumped_at ? !isExpired(listing) && !listing.published : true;

  const filterListings = (listingsToFilter, selectedFilter) => {
    if (selectedFilter === 'Draft') {
      return listingsToFilter.filter((listing) => isDraft(listing));
    }
    if (selectedFilter === 'Expired') {
      return listingsToFilter.filter((listing) => isExpired(listing));
    }
    if (selectedFilter === 'Active') {
      return listingsToFilter.filter((listing) => listing.published === true);
    }
    return listingsToFilter;
  };

  const customSort = (a, b) => {
    if (a[sort] === null) {
      return 1;
    }
    if (b[sort] === null) {
      return -1;
    }
    if (a[sort] > b[sort]) {
      return -1;
    }
    return 1;
  };

  const showListings = (
    selected,
    userListings,
    organizationListings,
    selectedFilter,
  ) => {
    let displayedListings;
    if (selected === 'user') {
      displayedListings = filterListings(userListings, selectedFilter).sort(
        customSort,
      );
      return displayedListings.map((listing) => (
        <ListingRow listing={listing} key={listing.id} />
      ));
    }
    displayedListings = filterListings(
      organizationListings,
      selectedFilter,
    ).sort(customSort);
    return displayedListings.map((listing) =>
      listing.organization_id === selected ? (
        <ListingRow key={listing.id} listing={listing} />
      ) : null,
    );
  };

  const setStateOnKeyPress = (event, setState) =>
    (event.key === 'Enter' || event.key === ' ') && setState();

  const filters = ['All', 'Active', 'Draft', 'Expired'];
  const filterButtons = filters.map((f, index) => (
    <span
      onClick={(event) => {
        setFilter(event.target.textContent);
      }}
      className={`rounded-btn ${filter === f ? 'active' : ''}`}
      role="button"
      key={index}
      onKeyPress={(event) =>
        setStateOnKeyPress(event, () => setFilter(event.target.textContent))
      }
      tabIndex="0"
    >
      {f}
    </span>
  ));

  const sortingDropdown = (
    <div className="dashboard-listings-actions">
      <div className="listings-dashboard-filter-buttons">{filterButtons}</div>
      <select
        aria-label="Filter listings"
        onChange={(event) => {
          setSort(event.target.value);
        }}
        onBlur={(event) => {
          setSort(event.target.value);
        }}
      >
        <option value="created_at" selected="selected">
          Recently Created
        </option>
        <option value="bumped_at">Recently Bumped</option>
      </select>
    </div>
  );

  const orgButtons = orgs.map((org) => (
    <span
      onClick={() => setSelectedListings(org.id)}
      className={`rounded-btn ${selectedListings === org.id ? 'active' : ''}`}
      role="button"
      key={org.id}
      tabIndex="0"
      onKeyPress={(event) =>
        setStateOnKeyPress(event, () => setSelectedListings(org.id))
      }
    >
      {org.name}
    </span>
  ));

  const listingLength = (selected, userListings, organizationListings) => {
    return selected === 'user' ? (
      <h4>
        Listings Made:
        {userListings.length}
      </h4>
    ) : (
      <h4>
        Listings Made:{' '}
        {
          organizationListings.filter(
            (listing) => listing.organization_id === selected,
          ).length
        }
      </h4>
    );
  };

  const creditCount = (selected, userCreds, organizations) => {
    return selected === 'user' ? (
      <h4>
        Credits Available:
        {userCreds}
      </h4>
    ) : (
      <h4>
        Credits Available:{' '}
        {organizations.find((org) => org.id === selected).unspent_credits_count}
      </h4>
    );
  };

  return (
    <div className="dashboard-listings-container">
      <span
        onClick={() => setSelectedListings('user')}
        className={`rounded-btn ${selectedListings === 'user' ? 'active' : ''}`}
        role="button"
        tabIndex="0"
        onKeyPress={(event) =>
          setStateOnKeyPress(event, () => setSelectedListings('user'))
        }
      >
        Personalny
      </span>
      {orgButtons}
      <div className="dashboard-listings-header-wrapper">
        <div className="dashboard-listings-header">
          <h3>Listings</h3>
          {listingLength(selectedListings, listings, orgListings)}
          <a href="/listings/new">Create a Listing</a>
        </div>
        <div className="dashboard-listings-header">
          <h3>Credits</h3>
          {creditCount(selectedListings, userCredits, orgs)}
          <a href="/credits/purchase" data-no-instant>
            Buy Credits
          </a>
        </div>
      </div>
      {sortingDropdown}
      <div className="dashboard-listings-view">
        {showListings(selectedListings, listings, orgListings, filter)}
      </div>
    </div>
  );
};
