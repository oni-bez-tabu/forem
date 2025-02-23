import { h } from 'preact';
import PropTypes from 'prop-types';
import { OrganizationPicker } from '../../organization/OrganizationPicker';

export const PageTitle = ({
  organizations,
  organizationId,
  onToggle,
  previewLoading,
}) => {
  return (
    <div className="crayons-field__label flex items-center flex-1">
      <span className="hidden s:inline-block mr-2 whitespace-nowrap">
        {previewLoading ? 'Ładuję podgląd' : 'Utwórz post'}
      </span>
      {organizations && organizations.length > 0 && (
        <div>
          <OrganizationPicker
            name="article[organization_id]"
            id="article_publish_under_org"
            className="crayons-select mt-0"
            organizations={organizations}
            organizationId={organizationId}
            onToggle={onToggle}
            emptyLabel="Personalny"
          />
        </div>
      )}
    </div>
  );
};

PageTitle.propTypes = {
  organizations: PropTypes.arrayOf(PropTypes.string).isRequired,
  organizationId: PropTypes.string,
  onToggle: PropTypes.func.isRequired,
  previewLoading: PropTypes.bool.isRequired,
};

PageTitle.displayName = 'Organization';
