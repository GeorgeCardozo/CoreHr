import { useEffect, useState } from 'react';
import { obtenerFotoEmpleado } from '../services/api';

const COLORS = [
  '#008080', '#004d40', '#0f766e', '#0369a1', '#1d4ed8',
  '#6d28d9', '#a21caf', '#be185d', '#b91c1c', '#c2410c',
];

const employeeId = (employee) => employee?.empleado_id ?? employee?.id ?? null;

const employeeInitials = (employee) => {
  const firstName = String(employee?.nombres || 'C').trim();
  const lastName = String(employee?.apellidos || 'Colaborador').trim();
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const hasStoredPhoto = (employee) => {
  return employee?.tiene_foto_perfil === true;
};

const EmployeeAvatar = ({
  employee,
  alt,
  className = '',
  imageClassName = 'w-full h-full object-cover',
  previewSrc = null,
}) => {
  const id = employeeId(employee);
  const photoVersion = employee?.tiene_foto_perfil;
  const shouldLoadPhoto = Boolean(id && hasStoredPhoto(employee) && !previewSrc);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const initials = employeeInitials(employee);
  const colorIndex = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % COLORS.length;
  const color = COLORS[colorIndex];

  useEffect(() => {
    if (!shouldLoadPhoto) {
      setPhotoUrl(null);
      setImageFailed(false);
      return undefined;
    }

    const controller = new AbortController();
    let objectUrl = null;
    let active = true;
    setPhotoUrl(null);
    setImageFailed(false);

    obtenerFotoEmpleado(id, controller.signal)
      .then((blob) => {
        if (!active || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setPhotoUrl(objectUrl);
      })
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED' && error?.name !== 'CanceledError') {
          setImageFailed(true);
        }
      });

    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, photoVersion, shouldLoadPhoto]);

  const src = previewSrc || photoUrl;
  const accessibleLabel = alt || `Foto de perfil de ${employee?.nombres || 'colaborador'}`;

  return (
    <div
      className={`overflow-hidden flex items-center justify-center ${className}`}
      style={!src || imageFailed ? { backgroundColor: color } : undefined}
      aria-label={!src || imageFailed ? accessibleLabel : undefined}
      role={!src || imageFailed ? 'img' : undefined}
    >
      {src && !imageFailed ? (
        <img
          src={src}
          alt={accessibleLabel}
          className={imageClassName}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="text-white font-bold select-none" aria-hidden="true">{initials}</span>
      )}
    </div>
  );
};

export default EmployeeAvatar;
