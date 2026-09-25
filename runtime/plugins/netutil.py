import ipaddress
import socket


def is_private_host(host: str) -> bool:
    """True if the host resolves to any non-public address, or cannot be resolved."""
    try:
        infos = socket.getaddrinfo(host, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
    except (socket.gaierror, UnicodeError, ValueError):
        return True
    if not infos:
        return True
    for info in infos:
        try:
            ip = ipaddress.ip_address(info[4][0])
        except ValueError:
            return True
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        ):
            return True
    return False
