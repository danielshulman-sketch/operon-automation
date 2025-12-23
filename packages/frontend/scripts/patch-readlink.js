'use strict';

const fs = require('fs');

const normalize = (value) => {
  if (typeof value === 'string') {
    return value;
  }
  if (Buffer.isBuffer(value)) {
    return value.toString();
  }
  return `${value}`;
};

const patchAsyncReadlink = (original) => {
  if (!original || original.__onedrivePatched) {
    return original;
  }

  const patched = async function patchedReadlink(target, options) {
    try {
      return await original.call(this, target, options);
    } catch (error) {
      if (error && error.code === 'EINVAL') {
        return normalize(target);
      }
      throw error;
    }
  };
  Object.defineProperty(patched, '__onedrivePatched', { value: true });
  return patched;
};

const patchCallbackReadlink = (original) => {
  if (!original || original.__onedrivePatched) {
    return original;
  }

  const patched = function patchedReadlink(target, options, callback) {
    const hasCallback = typeof options === 'function';
    const cb = hasCallback ? options : callback;
    const opts = hasCallback ? undefined : options;

    const wrapped = (error, result) => {
      if (error && error.code === 'EINVAL') {
        return cb(null, normalize(target));
      }
      return cb(error, result);
    };

    return original.call(this, target, opts, wrapped);
  };
  Object.defineProperty(patched, '__onedrivePatched', { value: true });
  return patched;
};

const patchSyncReadlink = (original) => {
  if (!original || original.__onedrivePatched) {
    return original;
  }

  const patched = function patchedReadlinkSync(target, options) {
    try {
      return original.call(this, target, options);
    } catch (error) {
      if (error && error.code === 'EINVAL') {
        return normalize(target);
      }
      throw error;
    }
  };
  Object.defineProperty(patched, '__onedrivePatched', { value: true });
  return patched;
};

fs.promises.readlink = patchAsyncReadlink(fs.promises.readlink);
fs.readlink = patchCallbackReadlink(fs.readlink);
fs.readlinkSync = patchSyncReadlink(fs.readlinkSync);

if (process.env.NEXT_DEBUG_ONEDRIVE_PATCH === '1') {
  const message = [
    '[next-onedrive-fix]',
    'Patched fs.readlink* to ignore false symbolic links (EINVAL).',
    `cwd=${process.cwd()}`,
  ].join(' ');
  console.log(message);
}
