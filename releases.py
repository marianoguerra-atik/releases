'''entry point of releases project, check for updated packages'''

import os
import csv
import json
import requests

import feedformatter

def make_url(repo, org, name, branch):
    '''return the url to locate package.json for the given repo'''

    if repo == "github":
        return "https://raw.github.com/{org}/{name}/{branch}/package.json".format(org=org, name=name, branch=branch)
    else:
        return None

def read_latest_version(repo, org, name):
    '''return the latest version of a package if exists, otherwise
    return None'''
    path = "cache/{repo}/{org}/{name}/version".format(
            repo=repo, org=org, name=name)

    try:
        with open(path) as handle:
            return handle.read().strip()
    except IOError:
        return None

    return None

def write_latest_version(repo, org, name, version, package):
    '''write provided version of a package'''
    folder = "cache/{repo}/{org}/{name}".format(
            repo=repo, org=org, name=name)
    version_path = "{folder}/version".format(folder=folder)
    versions_path = "{folder}/versions".format(folder=folder)
    path = "{folder}/{version}.json".format(folder=folder, version=version)
    global_versions_path = "cache/releases"

    if not os.path.exists(folder):
        os.makedirs(folder)

    with open(version_path, "w") as handle:
        handle.write(version)

    with open(global_versions_path, "a") as handle:
        handle.write(path + "\n")

    with open(versions_path, "a") as handle:
        handle.write(version + "\n")

    json.dump(package, open(path, "w"), indent=2)

    return version

def check_updates_from_file(path):
    '''load project names and paths from *path* and check if there are
    updated versions of them'''

    no_package_json = []

    with open(path) as handle:
        reader = csv.reader(handle)

        for project in reader:

            if len(project) == 4:
                repo, org, name, branch = [item.strip() for item in project]

                url = make_url(repo, org, name, branch)

                if url is None:
                    print("can't build url for",
                            repo, org, name, branch)
                    continue

                old_version = read_latest_version(repo, org, name)
                print("checking project", name, "at", url)
                response = requests.get(url)

                if response.status_code == 200:
                    print("got package response")
                    package = response.json

                    new_version = package.get("version", None)
                    print("old", old_version, "new", new_version)

                    if new_version is None:
                        print("new version not found, skiping")
                        continue
                    elif new_version != old_version:
                        print("new version found")
                        write_latest_version(repo, org, name,
                                new_version, package)

                else:
                    print("expected 200 OK got", response.status_code)
                    no_package_json.append(name)
            else:
                print("invalid project", project)

    if no_package_json:
        print("there are projects without a package.json")
        for name in no_package_json:
            print(" *", name)

if __name__ == "__main__":
    check_updates_from_file("projects.list")
